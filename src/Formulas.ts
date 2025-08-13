//////////////////// Types ////////////////////
type ErrorCode = '#VALUE!'|'#DIV/0!'|'#NAME?'|'#REF!';
interface Err { kind: 'Error'; code: ErrorCode }
type Value = number | Err;

const ERR = (code: ErrorCode): Err => ({ kind: 'Error', code });
export const isErr = (v: Value): v is Err => typeof v === 'object' && v !== null && (v as any).kind === 'Error';

//////////////////// Tokenizer ////////////////////
type TokenType =
  | 'NUMBER' | 'IDENT' | 'LEFT_PAREN' | 'RIGHT_PAREN'
  | 'COMMA'  | 'COLON' // keep ':' only if you want simple ranges inside SUM
  | 'OP'     | 'EOF';

interface Token { type: TokenType; value: string; i: number }

const twoOps = new Set<string>([]);
const oneOps = new Set(['+','-','*','/','^']);

class Tokenizer {
  private i = 0;
  constructor(private s: string) {}
  private peek(n=0){ return this.s[this.i+n] ?? '' }
  private adv(n=1){ const c=this.s[this.i]; this.i+=n; return c }
  private skipWS(){ while(/\s/.test(this.peek())) this.adv() }

  next(): Token {
    this.skipWS();
    const i = this.i, c = this.peek();
    if (!c) return { type:'EOF', value:'', i };

    if (c === '(') { this.adv(); return { type:'LEFT_PAREN', value:'(', i }; }
    if (c === ')') { this.adv(); return { type:'RIGHT_PAREN', value:')', i }; }
    if (c === ',') { this.adv(); return { type:'COMMA', value:',', i }; }
    if (c === ':') { this.adv(); return { type:'COLON', value:':', i }; }

    const pair = c + this.peek(1);
    if (twoOps.has(pair)) { this.adv(2); return { type:'OP', value:pair, i }; }
    if (oneOps.has(c))    { this.adv();  return { type:'OP', value:c, i }; }

    if (/[0-9.]/.test(c)) {
      let out = '';
      if (c === '.' && !/[0-9]/.test(this.peek(1))) throw new Error(`Bad number at ${i}`);
      while (/[0-9]/.test(this.peek())) out += this.adv();
      if (this.peek() === '.') { out += this.adv(); while (/[0-9]/.test(this.peek())) out += this.adv(); }
      if (/[eE]/.test(this.peek())) {
        out += this.adv();
        if (/[+-]/.test(this.peek())) out += this.adv();
        if (!/[0-9]/.test(this.peek())) throw new Error(`Bad exponent at ${this.i}`);
        while (/[0-9]/.test(this.peek())) out += this.adv();
      }
      return { type:'NUMBER', value:out, i };
    }

    if (/[A-Za-z_$]/.test(c)) {
      let out = this.adv();
      while (/[A-Za-z0-9_$]/.test(this.peek())) out += this.adv();
      return { type:'IDENT', value:out, i };
    }

    throw new Error(`Unexpected '${c}' at ${i}`);
  }
}

//////////////////// AST ////////////////////
type Expr =
  | { kind:'Num'; v:number }
  | { kind:'Ref'; name:string }      // A1
  | { kind:'Call'; name:string; args: Expr[] }
  | { kind:'Unary'; op:'+'|'-'; arg: Expr }
  | { kind:'Bin'; op:'+'|'-'|'*'|'/'|'^'; left: Expr; right: Expr }
  | { kind:'Range'; a:string; b:string }; // only if you want SUM(A1:B3)

const Num = (s:string): Expr => ({ kind:'Num', v:Number(s) });

const isA1 = (name:string) => /^[A-Za-z]{1,3}[0-9]{1,7}$/.test(name);

//////////////////// Pratt Parser ////////////////////
const BP: Record<string, number> = { '^':80, '*':70, '/':70, '+':60, '-':60 };
// (optional) colon precedence if using ranges
const BP_COLON = 40;

class Parser {
  private i = 0;
  constructor(private toks: Token[]){}

  private peek(n=0){ return this.toks[this.i+n] ?? this.toks[this.toks.length-1] }
  private next(){ return this.toks[this.i++] ?? this.toks[this.toks.length-1] }
  private lbp(t: Token){ return t.type==='OP' ? (BP[t.value] ?? 0) : (t.type==='COLON' ? BP_COLON : 0) }

  parseFormula(): Expr {
    // optional leading '=' stripped by caller if you want
    const e = this.expr(0);
    if (this.peek().type !== 'EOF') throw new Error('Extra tokens at end');
    return e;
  }

  private expr(rbp:number): Expr {
    let t = this.next();
    let left = this.nud(t);
    while (rbp < this.lbp(this.peek())) {
      t = this.next();
      left = this.led(t, left);
    }
    return left;
  }

  private nud(t: Token): Expr {
    if (t.type === 'NUMBER') return Num(t.value);
    if (t.type === 'LEFT_PAREN') { const e = this.expr(0); const r = this.next(); if (r.type!=='RIGHT_PAREN') throw new Error(')'); return e; }
    if (t.type === 'OP' && (t.value === '+' || t.value === '-')) return { kind:'Unary', op: t.value, arg: this.expr(75) };
    if (t.type === 'IDENT') {
      // function call?
      if (this.peek().type === 'LEFT_PAREN') {
        this.next(); // '('
        const args: Expr[] = [];
        if (this.peek().type !== 'RIGHT_PAREN') {
          while (true) {
            args.push(this.expr(0));
            if (this.peek().type === 'COMMA') { this.next(); continue; }
            break;
          }
        }
        const r = this.next(); if (r.type!=='RIGHT_PAREN') throw new Error(')');
        return { kind:'Call', name: t.value, args };
      }
      // cell ref?
      if (isA1(t.value)) return { kind:'Ref', name: t.value };
      throw new Error(`Unknown identifier '${t.value}'`);
    }
    throw new Error(`Unexpected token ${t.type} '${t.value}'`);
  }

  private led(t: Token, left: Expr): Expr {
    if (t.type === 'OP') {
      const rbp = t.value === '^' ? BP[t.value]-1 : BP[t.value]; // right-assoc ^
      const right = this.expr(rbp);
      return { kind:'Bin', op: t.value as any, left, right };
    }
    if (t.type === 'COLON') {
      // only used inside SUM; we still parse it generally into a Range node
      // "A1:B3" where left is Ref and right must be Ref
      const rightExpr = this.expr(BP_COLON);
      if (left.kind!=='Ref' || rightExpr.kind!=='Ref') throw new Error('Range must be A1:B3');
      return { kind:'Range', a: left.name, b: rightExpr.name };
    }
    throw new Error(`Unexpected token after expr: ${t.type}`);
  }
}

//////////////////// Evaluator ////////////////////
export type Context = {
  getCell: (ref: string) => Value; // must return number or Err
  functions?: Record<string,(args: Value[])=>Value>;
};

function evaluate(e: Expr, ctx: Context): Value {
  switch (e.kind) {
    case 'Num':   return e.v;
    case 'Ref':   return ctx.getCell(e.name);
    case 'Unary': {
      const v = evaluate(e.arg, ctx); if (isErr(v)) return v;
      return e.op === '-' ? -v : +v;
    }
    case 'Bin': {
      const L = evaluate(e.left, ctx);  if (isErr(L)) return L;
      const R = evaluate(e.right, ctx); if (isErr(R)) return R;
      if (typeof L !== 'number' || typeof R !== 'number') return ERR('#VALUE!');
      switch (e.op) {
        case '+': return L + R;
        case '-': return L - R;
        case '*': return L * R;
        case '/': return R === 0 ? ERR('#DIV/0!') : L / R;
        case '^': return Math.pow(L, R);
      }
    }
    case 'Call': {
      const fn = (ctx.functions ?? defaultFns)[e.name.toUpperCase()];
      if (!fn) return ERR('#NAME?');
      const vals = e.args.map(a => evaluate(a, ctx));
      for (const v of vals) if (isErr(v)) return v;
      return fn(vals);
    }
    case 'Range': // only allowed when a function handles it (e.g., SUM). If it leaks, error.
      return ERR('#VALUE!');
  }
}

export function defaultFns(): Record<string,(args: Value[])=>Value> {
  return {
    SUM(args) { return reduceArgs(args, (acc, x) => acc + x, 0); },
    MIN(args) { return reduceArgs(args, (acc, x) => Math.min(acc, x), +Infinity); },
    MAX(args) { return reduceArgs(args, (acc, x) => Math.max(acc, x), -Infinity); },
  };
}

function reduceArgs(args: Value[], op: (acc:number, x:number)=>number, init:number): Value {
  let acc = init;
  for (const v of args) {
    if (typeof v === 'number') { acc = op(acc, v); continue; }
    if (isErr(v)) return v;
    // If you want to support a simple A1:B3 range arg, accept a marker object:
    // In this minimal version we don't get here because Range returns #VALUE!.
    return ERR('#VALUE!');
  }
  return acc;
}

//////////////////// Runner ////////////////////
export function runFormula(src: string, ctx: Context): Value {
  if (src.startsWith('=')) src = src.slice(1);
  try {
  const toks: Token[] = [];
  const tz = new Tokenizer(src);
  for (;;) { const t = tz.next(); toks.push(t); if (t.type==='EOF') break; }
  const ast = new Parser(toks).parseFormula();
  return evaluate(ast, ctx);
  } catch(error) {
    console.log(error);
    return ERR("#NAME?")
  }
}