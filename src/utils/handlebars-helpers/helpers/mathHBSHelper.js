export const mathHBSHelper = {
  name: 'math',
  fn: (left, operator, right) => {
    const first = Number(left);
    const second = Number(right);
    if (!Number.isFinite(first) || !Number.isFinite(second)) {
      throw new TypeError('The math helper requires finite numeric operands');
    }

    switch (operator) {
      case '+':
        return first + second;
      case '-':
        return first - second;
      case '*':
        return first * second;
      case '/':
        return first / second;
      case '%':
        return first % second;
      case '**':
        return first ** second;
      default:
        throw new TypeError(`Unsupported math operator: ${operator}`);
    }
  }
};
