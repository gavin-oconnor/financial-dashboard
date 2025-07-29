type TokenType =
| 'EQUALS'
| 'NUMBER'
| 'CELL_REFERENCE'
| 'OPERATOR'
| 'FUNCTION'
| 'COMMA'
| 'LEFT_PAREN'
| 'RIGHT_PAREN';

interface Token {
    type: TokenType;
    value: string;
}

const isLetter = (char: string) => /[A-Z]/i.test(char);
const isDigit = (char: string) => /[0-9]/.test(char);
const getPrecedence = (op: string): number => {
  if (op === '^') return 3;
  if (op === '*' || op === '/') return 2;
  if (op === '+' || op === '-') return 1;
  return 0;
};

const tokenize = (input: string): Token[] => {
    const tokens: Token[] = [];
    let i = 0;
  
    while (i < input.length) {
      const char = input[i];
  
      if (char === '=') {
        tokens.push({ type: 'EQUALS', value: '=' });
        i++;
      } else if (char === ',') {
        tokens.push({ type: 'COMMA', value: ',' });
        i++;
      } else if (char === '(') {
        tokens.push({ type: 'LEFT_PAREN', value: '(' });
        i++;
      } else if (char === ')') {
        tokens.push({ type: 'RIGHT_PAREN', value: ')' });
        i++;
      } else if ('+-*/^'.includes(char)) {
        tokens.push({ type: 'OPERATOR', value: char });
        i++;
      } else if (isDigit(char) || char === '.') {
        let num = '';
        while (i < input.length && (isDigit(input[i]) || input[i] === '.')) {
          num += input[i++];
        }
        tokens.push({ type: 'NUMBER', value: num });
      } else if (isLetter(char)) {
        let id = '';
        while (i < input.length && isLetter(input[i])) {
          id += input[i++];
        }
  
        if (i < input.length && isDigit(input[i])) {
          // It's a cell reference
          while (i < input.length && isDigit(input[i])) {
            id += input[i++];
          }
          tokens.push({ type: 'CELL_REFERENCE', value: id });
        } else {
          // It's a function name
          tokens.push({ type: 'FUNCTION', value: id });
        }
      } else if (char === ' ' || char === '\t' || char === '\n') {
        // skip whitespace
        i++;
      } else {
        throw new Error(`Unrecognized character: "${char}" at position ${i}`);
      }
    }
  
    return tokens;
  };

 type ASTNode =
  | { type: 'NumberLiteral'; value: number }
  | { type: 'CellReference'; value: string }
  | { type: 'BinaryOperation'; operator: string; left: ASTNode; right: ASTNode }
  | { type: 'FunctionCall'; name: string; args: ASTNode[] };

const parse = (tokens: Token[]): ASTNode => {
  let position = 0;
  const peek = (): Token | undefined => {
    return tokens[position];
  }
  const consume = (): Token  => {
    return tokens[position++];
  }

  const parseExpression = (precedence = 0): ASTNode => {
    let left = parsePrimary();
  
    while (true) {
      const token = peek();
      if (!token || token.type !== 'OPERATOR') break;
  
      const tokenPrecedence = getPrecedence(token.value);
      if (tokenPrecedence < precedence) break;
  
      consume(); // consume the operator
      const right = parseExpression(tokenPrecedence + 1);
      left = {
        type: 'BinaryOperation',
        operator: token.value,
        left,
        right,
      };
    }
  
    return left;
  };

  const parseFunctionCall = (): ASTNode => {
    const funcToken = consume(); // function name
    if (peek()?.type !== 'LEFT_PAREN') throw new Error("Expected '(' after function name");
    consume(); // consume '('
  
    const args: ASTNode[] = [];
    while (peek() && peek()?.type !== 'RIGHT_PAREN') {
      args.push(parseExpression());
      if (peek()?.type === 'COMMA') consume();
    }
  
    if (peek()?.type !== 'RIGHT_PAREN') throw new Error("Expected ')'");
    consume(); // consume ')'
  
    return {
      type: 'FunctionCall',
      name: funcToken.value,
      args,
    };
  };

  const parsePrimary = (): ASTNode => {
    const token = peek();
  
    if (!token) throw new Error("Unexpected end of input");
  
    if (token.type === 'NUMBER') {
      consume();
      return { type: 'NumberLiteral', value: parseFloat(token.value) };
    }
  
    if (token.type === 'CELL_REFERENCE') {
      consume();
      return { type: 'CellReference', value: token.value };
    }
  
    if (token.type === 'FUNCTION') {
      return parseFunctionCall();
    }
  
    if (token.type === 'LEFT_PAREN') {
      consume(); // consume '('
      const expr = parseExpression();
      if (peek()?.type !== 'RIGHT_PAREN') throw new Error("Expected ')'");
      consume(); // consume ')'
      return expr;
    }
  
    throw new Error(`Unexpected token: ${token.type}`);
  };
  if (peek()?.type === 'EQUALS') consume();

  return parseExpression();
}

const sheet: Record<string, number> = {
  "A1": 10,
  "B2": 30
}

const evaluate = (node: ASTNode, getValue: (cell: string) => number): number => {
  switch (node.type) {
    case 'NumberLiteral':
      return node.value
    case 'CellReference':
      console.log("getting value");
      console.log(getValue(node.value));
      return getValue(node.value);
    case 'BinaryOperation':
      const left = evaluate(node.left, getValue);
      const right = evaluate(node.right, getValue);
      switch (node.operator) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return left / right;
        case '^': return left ** right;
        default: throw new Error(`Unknown operator: ${node.operator}`);
      }
    case 'FunctionCall':
      const args = node.args.map(arg => evaluate(arg, getValue));
      console.log(args);
      console.log()
      switch(node.name.toUpperCase()) {
        case 'SUM': return args.reduce((a, b) => a + b, 0);
        default: throw new Error(`Unknown function: ${node.name}`);
      }
      default:
        throw new Error(`Unknown node type: ${(node as any).type}`);
  }
}

export const handleFormula = (formulaText: string, getValue: (cell: string) => number): number | string | null => {
  console.log('evaluating')
    try {
        const returnValue = evaluate(parse(tokenize(formulaText)),getValue);
        console.log("gonna return")
        console.log(returnValue);
        return returnValue;
    } catch(error) {
        console.log("caught")
        console.error(error);
    }
    return null;
}

// const input = '=SUM(A1, B2) * 10';
// console.log(evaluate(parse(tokenize(input)), (cellRef: string) => sheet[cellRef]));