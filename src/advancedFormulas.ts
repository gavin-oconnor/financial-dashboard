// spreadsheet_pratt.ts
// Tokenizer + Pratt parser + evaluator for spreadsheet-style formulas.
// Run: ts-node spreadsheet_pratt.ts "=SUM(A1:A2) + LEFT(\"Hello\", 3) & \"!\""

// (Tokenizer and parser code remains unchanged above...)

// spreadsheet_pratt.ts
// Single-file: Tokenizer + Pratt parser + tiny demo runner.
// Run with:  ts-node spreadsheet_pratt.ts "=SUM($A$1:B2)+LEFT(\"hi\""",2)&\"!\""

// -------------------- Tokens --------------------
export type TokenType =
  | 'EQUALS'
  | 'NUMBER'
  | 'STRING'
  | 'IDENTIFIER'
  | 'COLON'
  | 'BANG'
  | 'COMMA'
  | 'LEFT_PAREN'
  | 'RIGHT_PAREN'
  | 'OPERATOR'
  | 'EOF'

export interface Token {
  type: TokenType
  value: string
  start: number
  end: number
}

export class LexError extends Error {
  constructor(
    msg: string,
    public index: number
  ) {
    super(msg)
  }
}

// -------------------- Tokenizer --------------------
const twoCharOps = new Set(['<=', '>=', '<>', '==', '&&', '||'])
const oneCharOps = new Set(['+', '-', '*', '/', '^', '&', '<', '>', '%'])

const isDigit = (c: string) => c >= '0' && c <= '9'
const isIdentStart = (c: string) => /[A-Za-z_$]/.test(c)
const isIdentPart = (c: string) => /[A-Za-z0-9_$.]/.test(c)

export class Tokenizer {
  private i = 0
  constructor(private input: string) {}

  tokenize(): Token[] {
    const out: Token[] = []
    let t: Token
    do {
      t = this.nextToken()
      out.push(t)
    } while (t.type !== 'EOF')
    return out
  }

  private peek(o = 0) {
    return this.input[this.i + o] ?? ''
  }
  private advance(n = 1) {
    this.i += n
    return this.input[this.i - 1]
  }
  private tok(type: TokenType, value: string, start: number): Token {
    return { type, value, start, end: this.i }
  }

  private skipWS() {
    while (/\s/.test(this.peek())) this.advance()
  }

  private readString(start: number): Token {
    this.advance() // opening "
    let out = ''
    while (true) {
      const c = this.peek()
      if (!c) throw new LexError('Unterminated string', this.i)
      if (c === '"') {
        if (this.peek(1) === '"') {
          this.advance(2)
          out += '"'
          continue
        }
        this.advance()
        break // closing
      }
      if (c === '\\') {
        this.advance()
        const e = this.peek()
        if (!e) throw new LexError('Bad escape', this.i)
        this.advance()
        if (e === 'n') out += '\n'
        else if (e === 't') out += '\t'
        else if (e === 'r') out += '\r'
        else out += e
      } else {
        out += this.advance()
      }
    }
    return this.tok('STRING', out, start)
  }

  private readNumber(start: number): Token {
    let s = ''
    while (isDigit(this.peek())) s += this.advance()
    if (this.peek() === '.') {
      s += this.advance()
      while (isDigit(this.peek())) s += this.advance()
    }
    if (/[eE]/.test(this.peek())) {
      const p1 = this.peek(1),
        p2 = this.peek(2)
      if (isDigit(p1) || ((p1 === '+' || p1 === '-') && isDigit(p2))) {
        s += this.advance()
        if (this.peek() === '+' || this.peek() === '-') s += this.advance()
        if (!isDigit(this.peek())) throw new LexError('Malformed exponent', this.i)
        while (isDigit(this.peek())) s += this.advance()
      }
    }
    return this.tok('NUMBER', s, start)
  }

  private readIdent(start: number): Token {
    let s = this.advance()
    while (isIdentPart(this.peek())) s += this.advance()
    return this.tok('IDENTIFIER', s, start)
  }

  private nextToken(): Token {
    this.skipWS()
    const start = this.i
    const ch = this.peek()
    if (!ch) return this.tok('EOF', '', start)

    if (ch === '=') {
      this.advance()
      return this.tok('EQUALS', '=', start)
    }
    if (ch === ':') {
      this.advance()
      return this.tok('COLON', ':', start)
    }
    if (ch === '!') {
      this.advance()
      return this.tok('BANG', '!', start)
    }
    if (ch === ',') {
      this.advance()
      return this.tok('COMMA', ',', start)
    }
    if (ch === '(') {
      this.advance()
      return this.tok('LEFT_PAREN', '(', start)
    }
    if (ch === ')') {
      this.advance()
      return this.tok('RIGHT_PAREN', ')', start)
    }

    if (ch === '"') return this.readString(start)
    if (isDigit(ch) || (ch === '.' && isDigit(this.peek(1)))) return this.readNumber(start)
    if (isIdentStart(ch)) return this.readIdent(start)

    const pair = ch + this.peek(1)
    if (twoCharOps.has(pair)) {
      this.advance(2)
      return this.tok('OPERATOR', pair, start)
    }
    if (oneCharOps.has(ch)) {
      this.advance()
      return this.tok('OPERATOR', ch, start)
    }

    throw new LexError(`Unexpected char '${ch}'`, this.i)
  }
}

// -------------------- AST --------------------
export type Expr =
  | NumberLiteral
  | StringLiteral
  | Identifier
  | CellRef
  | SheetRef
  | RangeRef
  | UnaryOp
  | BinaryOp
  | Call
export interface NumberLiteral {
  kind: 'NumberLiteral'
  value: number
  raw: string
}
export interface StringLiteral {
  kind: 'StringLiteral'
  value: string
}
export interface Identifier {
  kind: 'Identifier'
  name: string
}
export interface CellRef {
  kind: 'CellRef'
  ref: string
}
export interface SheetRef {
  kind: 'SheetRef'
  sheet: string
  target: CellRef | RangeRef
}
export interface RangeRef {
  kind: 'RangeRef'
  left: CellRef | SheetRef
  right: CellRef | SheetRef
}
export interface UnaryOp {
  kind: 'UnaryOp'
  op: string
  arg: Expr
}
export interface BinaryOp {
  kind: 'BinaryOp'
  op: string
  left: Expr
  right: Expr
}
export interface Call {
  kind: 'Call'
  callee: Identifier
  args: Expr[]
}

export const Num = (raw: string): NumberLiteral => ({
  kind: 'NumberLiteral',
  value: Number(raw),
  raw,
})
export const Str = (v: string): StringLiteral => ({ kind: 'StringLiteral', value: v })
export const Id = (n: string): Identifier => ({ kind: 'Identifier', name: n })
export const Ref = (r: string): CellRef => ({ kind: 'CellRef', ref: r })

const isCellRef = (name: string) => /^\$?[A-Za-z]{1,3}\$?[0-9]{1,7}$/.test(name)

// -------------------- Pratt Parser --------------------
const INFIX: Record<string, { bp: number; assoc: 'left' | 'right' | 'none' }> = {
  '^': { bp: 80, assoc: 'right' },
  '*': { bp: 70, assoc: 'left' },
  '/': { bp: 70, assoc: 'left' },
  '%': { bp: 70, assoc: 'left' },
  '+': { bp: 60, assoc: 'left' },
  '-': { bp: 60, assoc: 'left' },
  '&': { bp: 55, assoc: 'left' },
  '=': { bp: 50, assoc: 'none' },
  '==': { bp: 50, assoc: 'none' },
  '<>': { bp: 50, assoc: 'none' },
  '<': { bp: 50, assoc: 'none' },
  '<=': { bp: 50, assoc: 'none' },
  '>': { bp: 50, assoc: 'none' },
  '>=': { bp: 50, assoc: 'none' },
}
const BP_COLON = 40 // range ':'
const BP_BANG = 95 // sheet '!'
const BP_PREFIX = 75 // unary +/-

export class ParseError extends Error {}

export class Parser {
  private i = 0
  constructor(private tokens: Token[]) {}

  parseFormula(): Expr {
    if (this.peek().type === 'EQUALS') this.next()
    const e = this.parseExpr(0)
    this.expect('EOF')
    return e
  }

  private parseExpr(rbp: number): Expr {
    let t = this.next()
    let left = this.nud(t)
    while (rbp < this.lbp(this.peek())) {
      t = this.next()
      left = this.led(t, left)
    }
    return left
  }

  private nud(t: Token): Expr {
    switch (t.type) {
      case 'NUMBER':
        return Num(t.value)
      case 'STRING':
        return Str(t.value)
      case 'LEFT_PAREN': {
        const e = this.parseExpr(0)
        this.expect('RIGHT_PAREN')
        return e
      }
      case 'OPERATOR': {
        if (t.value === '+' || t.value === '-') {
          const arg = this.parseExpr(BP_PREFIX)
          return { kind: 'UnaryOp', op: t.value, arg }
        }
        throw new ParseError(`Unexpected prefix operator '${t.value}'`)
      }
      case 'IDENTIFIER': {
        if (this.peek().type === 'LEFT_PAREN') {
          this.next() // '('
          const args: Expr[] = []
          if (this.peek().type !== 'RIGHT_PAREN') {
            while (true) {
              args.push(this.parseExpr(0))
              if (this.peek().type === 'COMMA') {
                this.next()
                continue
              }
              break
            }
          }
          this.expect('RIGHT_PAREN')
          return { kind: 'Call', callee: Id(t.value), args }
        }
        return isCellRef(t.value) ? Ref(t.value) : Id(t.value)
      }
      case 'EQUALS': {
        // stray '=' as prefix: just parse next expr
        return this.parseExpr(0)
      }
      default:
        throw new ParseError(`Unexpected token: ${t.type} '${t.value}'`)
    }
  }

  private led(t: Token, left: Expr): Expr {
    switch (t.type) {
      case 'OPERATOR': {
        const info = INFIX[t.value]
        if (!info) throw new ParseError(`Unknown operator '${t.value}'`)
        const rbp = info.assoc === 'right' ? info.bp - 1 : info.bp
        const right = this.parseExpr(rbp)
        return { kind: 'BinaryOp', op: t.value, left, right }
      }
      case 'EQUALS': {
        const info = INFIX['=']
        const rbp = info.assoc === 'right' ? info.bp - 1 : info.bp
        const right = this.parseExpr(rbp)
        return { kind: 'BinaryOp', op: '=', left, right }
      }
      case 'COLON': {
        const right = this.parseExpr(BP_COLON)
        if (!isCellLike(left))
          throw new ParseError('Left of ":" must be a cell or sheet-qualified cell')
        if (!isCellLike(right))
          throw new ParseError('Right of ":" must be a cell or sheet-qualified cell')
        return { kind: 'RangeRef', left: toCellLike(left), right: toCellLike(right) }
      }
      case 'BANG': {
        const right = this.parseExpr(BP_BANG)
        const sheet = asSheetName(left)
        if (!sheet) throw new ParseError('Left of "!" must be a sheet name')
        if (right.kind === 'CellRef' || right.kind === 'RangeRef')
          return { kind: 'SheetRef', sheet, target: right }
        if (right.kind === 'Identifier' && isCellRef(right.name))
          return { kind: 'SheetRef', sheet, target: Ref(right.name) }
        throw new ParseError('Right of "!" must be a cell or range')
      }
      default:
        throw new ParseError(`Unexpected token after expression: ${t.type} '${t.value}'`)
    }
  }

  private lbp(t: Token): number {
    switch (t.type) {
      case 'OPERATOR':
        return INFIX[t.value]?.bp ?? 0
      case 'EQUALS':
        return INFIX['='].bp
      case 'COLON':
        return BP_COLON
      case 'BANG':
        return BP_BANG
      default:
        return 0
    }
  }

  private peek(o = 0) {
    return this.tokens[this.i + o] ?? this.tokens[this.tokens.length - 1]
  }
  private next() {
    return this.tokens[this.i++] ?? this.tokens[this.tokens.length - 1]
  }
  private expect(type: TokenType, value?: string) {
    const t = this.next()
    if (t.type !== type || (value !== undefined && t.value !== value))
      throw new ParseError(`Expected ${value ?? type}, got ${t.type} '${t.value}'`)
    return t
  }
}

function asSheetName(e: Expr): string | null {
  return e.kind === 'Identifier' ? e.name : null
}
function isCellLike(e: Expr): e is CellRef | SheetRef {
  return e.kind === 'CellRef' || e.kind === 'SheetRef'
}
function toCellLike(e: Expr): CellRef | SheetRef {
  if (e.kind === 'CellRef' || e.kind === 'SheetRef') return e
  if (e.kind === 'Identifier' && isCellRef(e.name)) return Ref(e.name)
  throw new ParseError('Expected a cell reference')
}

// -------------------- Debug Printer --------------------
export function printAST(e: Expr): string {
  switch (e.kind) {
    case 'NumberLiteral':
      return e.raw
    case 'StringLiteral':
      return JSON.stringify(e.value)
    case 'Identifier':
      return e.name
    case 'CellRef':
      return e.ref
    case 'SheetRef':
      return `${e.sheet}!${printAST(e.target)}`
    case 'RangeRef':
      return `${printAST(e.left)}:${printAST(e.right)}`
    case 'UnaryOp':
      return `(${e.op}${printAST(e.arg)})`
    case 'BinaryOp':
      return `(${printAST(e.left)} ${e.op} ${printAST(e.right)})`
    case 'Call':
      return `${e.callee.name}(${e.args.map(printAST).join(', ')})`
  }
}

// -------------------- Evaluator --------------------
export type Scalar = number | string | boolean | ErrorValue
export type Value = Scalar | Scalar[] | Value[][]
export interface ErrorValue {
  kind: 'Error'
  code: '#VALUE!' | '#DIV/0!' | '#NAME?' | '#REF!'
}

export interface EvalContext {
  getCell: (sheet: string | null, ref: string) => Value // must return scalars for cells
  functions?: Record<string, (args: Value[], ctx: EvalContext) => Value>
}

const ERR = (code: ErrorValue['code']): ErrorValue => ({ kind: 'Error', code })
export const isErr = (v: Value): v is ErrorValue =>
  typeof v === 'object' && v !== null && (v as any).kind === 'Error'
export const isArr = (v: Value): v is Value[][] => Array.isArray(v)
export const isNum = (v: Value): v is number => typeof v === 'number'
export const isBool = (v: Value): v is boolean => typeof v === 'boolean'
export const isStr = (v: Value): v is string => typeof v === 'string'

function toText(v: Value): string {
  if (isErr(v)) return v.code
  if (isArr(v)) return '[Array]'
  if (isBool(v)) return v ? 'TRUE' : 'FALSE'
  return v === null || v === undefined ? '' : String(v)
}
function toNumber(v: Value): number | ErrorValue {
  if (isErr(v)) return v
  if (isArr(v)) return ERR('#VALUE!')
  if (typeof v === 'number') return v
  const n = Number(v)
  return Number.isFinite(n) ? n : ERR('#VALUE!')
}

// A1 helpers ---------------------------------------------------------------
function colToIndex(col: string): number {
  // A->1, Z->26, AA->27
  let n = 0
  for (const ch of col.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n
}
function parseA1(ref: string): { col: number; row: number } | null {
  const m = /^\$?([A-Za-z]{1,3})\$?([0-9]{1,7})$/.exec(ref)
  if (!m) return null
  return { col: colToIndex(m[1]), row: Number(m[2]) }
}

function rangeValues(
  sheet: string | null,
  left: CellRef | SheetRef,
  right: CellRef | SheetRef,
  ctx: EvalContext
): Value[][] | ErrorValue {
  // Normalize to sheet + cell strings
  const norm = (x: CellRef | SheetRef): { sheet: string | null; ref: string } =>
    x.kind === 'SheetRef' && x.target.kind === 'CellRef'
      ? { sheet: x.sheet, ref: x.target.ref }
      : x.kind === 'CellRef'
        ? { sheet: sheet, ref: x.ref }
        : { sheet, ref: (x as any).ref }

  const L = norm(left),
    R = norm(right)
  const pL = parseA1(L.ref),
    pR = parseA1(R.ref)
  if (!pL || !pR) return ERR('#REF!')
  const c1 = Math.min(pL.col, pR.col),
    c2 = Math.max(pL.col, pR.col)
  const r1 = Math.min(pL.row, pR.row),
    r2 = Math.max(pL.row, pR.row)
  const out: Value[][] = []
  for (let r = r1; r <= r2; r++) {
    const row: Value[] = []
    for (let c = c1; c <= c2; c++) {
      // convert back to A1 like A, B, ...
      let n = c,
        col = ''
      while (n > 0) {
        const k = (n - 1) % 26
        col = String.fromCharCode(65 + k) + col
        n = Math.floor((n - 1) / 26)
      }
      row.push(ctx.getCell(L.sheet, `${col}${r}`))
    }
    out.push(row)
  }
  return out
}

export function evaluate(e: Expr, ctx: EvalContext): Value {
  if (!ctx.functions) ctx.functions = defaultFunctions()
  switch (e.kind) {
    case 'NumberLiteral':
      return e.value
    case 'StringLiteral':
      return e.value
    case 'Identifier':
      return ERR('#NAME?')
    case 'CellRef':
      return ctx.getCell(null, e.ref)
    case 'SheetRef': {
      const t = e.target
      if (t.kind === 'CellRef') return ctx.getCell(e.sheet, t.ref)
      if (t.kind === 'RangeRef') return rangeValues(e.sheet, t.left, t.right, ctx)
      return ERR('#REF!')
    }
    case 'RangeRef':
      return rangeValues(null, e.left, e.right, ctx)
    case 'UnaryOp': {
      const v = evaluate(e.arg, ctx)
      if (isErr(v)) return v
      const n = toNumber(v)
      if (isErr(n)) return n
      return e.op === '-' ? -n : +n
    }
    case 'BinaryOp': {
      const L = evaluate(e.left, ctx)
      if (isErr(L)) return L
      const R = evaluate(e.right, ctx)
      if (isErr(R)) return R
      switch (e.op) {
        case '+':
        case '-':
        case '*':
        case '/':
        case '^':
        case '%': {
          const a = toNumber(L)
          if (isErr(a)) return a
          const b = toNumber(R)
          if (isErr(b)) return b
          if (e.op === '+') return a + b
          if (e.op === '-') return a - b
          if (e.op === '*') return a * b
          if (e.op === '/') return b === 0 ? ERR('#DIV/0!') : a / b
          if (e.op === '%') return a % b
          return Math.pow(a, b)
        }
        case '&':
          return toText(L) + toText(R)
        case '=':
        case '==':
          return eq(L, R)
        case '<>':
          return neq(L, R)
        case '<':
          return lt(L, R)
        case '<=':
          return lte(L, R)
        case '>':
          return gt(L, R)
        case '>=':
          return gte(L, R)
        default:
          return ERR('#VALUE!')
      }
    }
    case 'Call': {
      const name = e.callee.name.toUpperCase()
      if (name === 'IF') {
        const cond = evaluate(e.args[0], ctx)
        if (isErr(cond)) return cond
        const truthy = truth(cond)
        return evaluate(e.args[truthy ? 1 : 2] ?? Str(''), ctx)
      }
      const fn = ctx.functions[name]
      if (!fn) return ERR('#NAME?')
      const args = e.args.map((a) => evaluate(a, ctx))
      const firstErr = args.find(isErr)
      if (firstErr) return firstErr as ErrorValue
      return fn(args, ctx)
    }
  }
}

function truth(v: Value): boolean {
  if (isErr(v)) return false
  if (isArr(v)) return v.length > 0 && v[0].length > 0 && !!truth(v[0][0])
  return !!v
}
function cmpCoerce(L: Value, R: Value): { a: number | string; b: number | string } | ErrorValue {
  const aNum = toNumber(L)
  const bNum = toNumber(R)
  if (!isErr(aNum) && !isErr(bNum)) return { a: aNum, b: bNum }
  return { a: toText(L), b: toText(R) }
}
function eq(L: Value, R: Value): boolean | ErrorValue {
  const c = cmpCoerce(L, R)
  return isErr(c) ? c : c.a === c.b
}
function neq(L: Value, R: Value): boolean | ErrorValue {
  const c = cmpCoerce(L, R)
  return isErr(c) ? c : c.a !== c.b
}
function lt(L: Value, R: Value): boolean | ErrorValue {
  const c = cmpCoerce(L, R)
  return isErr(c) ? c : (c.a as any) < (c.b as any)
}
function lte(L: Value, R: Value): boolean | ErrorValue {
  const c = cmpCoerce(L, R)
  return isErr(c) ? c : (c.a as any) <= (c.b as any)
}
function gt(L: Value, R: Value): boolean | ErrorValue {
  const c = cmpCoerce(L, R)
  return isErr(c) ? c : (c.a as any) > (c.b as any)
}
function gte(L: Value, R: Value): boolean | ErrorValue {
  const c = cmpCoerce(L, R)
  return isErr(c) ? c : (c.a as any) >= (c.b as any)
}

function flatten(values: Value[]): Scalar[] | ErrorValue {
  const out: Scalar[] = []
  for (const v of values) {
    if (isErr(v)) return v
    if (isArr(v)) {
      for (const row of v)
        for (const cell of row) {
          if (isErr(cell)) return cell
          if (!isArr(cell)) out.push(cell as Scalar)
        }
    } else out.push(v as Scalar)
  }
  return out
}

export function defaultFunctions(): Record<string, (args: Value[], ctx: EvalContext) => Value> {
  return {
    SUM(args) {
      const flat = flatten(args)
      if (isErr(flat)) return flat
      let s = 0
      for (const v of flat) {
        const n = toNumber(v)
        if (!isErr(n)) s += n
      }
      return s
    },
    LEFT([text, count]) {
      const s = toText(text)
      const n = toNumber(count)
      if (isErr(n)) return n
      return s.slice(0, n)
    },
    LEN([text]) {
      return toText(text).length
    },
    AND(args) {
      for (const a of args) {
        const t = truth(a)
        if (!t) return false
      }
      return true
    },
    OR(args) {
      for (const a of args) {
        const t = truth(a)
        if (t) return true
      }
      return false
    },
  } as Record<string, (args: Value[], ctx: EvalContext) => Value>
}
