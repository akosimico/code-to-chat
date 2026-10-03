// Each challenge has two forms:
//  - function form (JavaScript, Python): write `fn`; tests call it with `args`.
//  - io form (C, C++, C#, Java): read stdin, print to stdout; tests give `input` and `output`.
// To add one, copy any mk(...) line below and edit it.
const fizz = (n) => Array.from({ length: n }, (_, i) => {
  const k = i + 1;
  return k % 15 === 0 ? 'FizzBuzz' : k % 3 === 0 ? 'Fizz' : k % 5 === 0 ? 'Buzz' : k;
});
const fizzLines = (n) => fizz(n).join('\n');
const A = (...args) => args;   // shorthand for an argument list

const IO_STARTERS = {
  c: '#include <stdio.h>\n\nint main(void) {\n    char line[1024];\n    fgets(line, sizeof line, stdin);   // reads one line\n    // your code: print the answer with printf\n    return 0;\n}',
  cpp: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string line;\n    getline(cin, line);   // reads one line\n    // your code: print the answer with cout\n    return 0;\n}',
  cs: 'using System;\n\nclass Program {\n    static void Main() {\n        string line = Console.ReadLine();   // reads one line\n        // your code: print the answer with Console.WriteLine\n    }\n}',
  java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String line = sc.nextLine();   // reads one line\n        // your code: print the answer with System.out.println\n    }\n}'
};

const mk = (title, fn, params, prompt, tests, ioPrompt, ioTests) => ({
  title, prompt, fn,
  starter: { js: `function ${fn}(${params}) {\n  \n}`, py: `def ${fn}(${params}):\n    pass` },
  tests,
  io: { prompt: ioPrompt, tests: ioTests }
});

const CHALLENGES = [
  mk('Build a calculator', 'calculate', 'a, op, b',
    'Write calculate(a, op, b). op is "+", "-", "*" or "/". Return the result. Dividing by zero returns the string "error".',
    [{ args: A(3, '+', 4), expected: 7 }, { args: A(10, '-', 4), expected: 6 }, { args: A(6, '*', 7), expected: 42 }, { args: A(10, '/', 4), expected: 2.5 }, { args: A(5, '/', 0), expected: 'error' }],
    'Read one line in the form "a op b" (integers, op is + - * or /). Print the result. Division is whole-number division. Dividing by zero prints error.',
    [{ input: '3 + 4', output: '7' }, { input: '10 - 4', output: '6' }, { input: '6 * 7', output: '42' }, { input: '20 / 4', output: '5' }, { input: '5 / 0', output: 'error' }]),

  mk('Reverse a string', 'reverse', 's',
    'Write reverse(s) that returns the string backwards.',
    [{ args: A('abc'), expected: 'cba' }, { args: A(''), expected: '' }, { args: A('hello world'), expected: 'dlrow olleh' }],
    'Read one line of text and print it backwards.',
    [{ input: 'abc', output: 'cba' }, { input: 'a', output: 'a' }, { input: 'hello world', output: 'dlrow olleh' }]),

  mk('FizzBuzz', 'fizzbuzz', 'n',
    'Write fizzbuzz(n) returning a list of 1..n. Multiples of 3 become "Fizz", of 5 "Buzz", of both "FizzBuzz". Other numbers stay numbers.',
    [{ args: A(5), expected: fizz(5) }, { args: A(15), expected: fizz(15) }, { args: A(1), expected: [1] }],
    'Read n. Print 1..n, one per line. Multiples of 3 print Fizz, of 5 print Buzz, of both print FizzBuzz.',
    [{ input: '5', output: fizzLines(5) }, { input: '15', output: fizzLines(15) }, { input: '1', output: '1' }]),

  mk('Palindrome check', 'palindrome', 's',
    'Write palindrome(s) that returns true if s reads the same forwards and backwards, ignoring case and spaces.',
    [{ args: A('Racecar'), expected: true }, { args: A('never odd or even'), expected: true }, { args: A('hello'), expected: false }],
    'Read one line. Print true if it reads the same forwards and backwards (ignoring case and spaces), otherwise print false.',
    [{ input: 'Racecar', output: 'true' }, { input: 'never odd or even', output: 'true' }, { input: 'hello', output: 'false' }]),

  mk('Sum a list', 'total', 'nums',
    'Write total(nums) that returns the sum of a list of numbers. An empty list gives 0.',
    [{ args: A([1, 2, 3]), expected: 6 }, { args: A([]), expected: 0 }, { args: A([-5, 5, 10]), expected: 10 }],
    'The first line is n. The second line has n integers separated by spaces. Print their sum.',
    [{ input: '3\n1 2 3', output: '6' }, { input: '1\n-5', output: '-5' }, { input: '3\n-5 5 10', output: '10' }]),

  mk('Factorial', 'factorial', 'n',
    'Write factorial(n) for n >= 0. factorial(0) is 1.',
    [{ args: A(0), expected: 1 }, { args: A(5), expected: 120 }, { args: A(10), expected: 3628800 }],
    'Read n (0 to 12). Print n factorial. 0 factorial is 1.',
    [{ input: '0', output: '1' }, { input: '5', output: '120' }, { input: '10', output: '3628800' }]),

  mk('Count vowels', 'vowels', 's',
    'Write vowels(s) that returns how many of a, e, i, o, u appear in s (any case).',
    [{ args: A('Hello'), expected: 2 }, { args: A('rhythm'), expected: 0 }, { args: A('AEIOU aeiou'), expected: 10 }],
    'Read one line. Print how many of a, e, i, o, u it contains (any case).',
    [{ input: 'Hello', output: '2' }, { input: 'rhythm', output: '0' }, { input: 'AEIOU aeiou', output: '10' }]),

  mk('Largest number', 'biggest', 'nums',
    'Write biggest(nums) that returns the largest number in a non-empty list.',
    [{ args: A([3, 9, 2]), expected: 9 }, { args: A([-5, -2, -9]), expected: -2 }, { args: A([7]), expected: 7 }],
    'The first line is n. The second line has n integers. Print the largest one.',
    [{ input: '3\n3 9 2', output: '9' }, { input: '3\n-5 -2 -9', output: '-2' }, { input: '1\n7', output: '7' }]),

  mk('Prime check', 'prime', 'n',
    'Write prime(n) that returns true if n is a prime number. 1 is not prime.',
    [{ args: A(2), expected: true }, { args: A(1), expected: false }, { args: A(17), expected: true }, { args: A(21), expected: false }],
    'Read n. Print true if it is prime, otherwise false. 1 is not prime.',
    [{ input: '2', output: 'true' }, { input: '1', output: 'false' }, { input: '17', output: 'true' }, { input: '21', output: 'false' }]),

  mk('Count words', 'words', 's',
    'Write words(s) that returns how many words are in s. Words are separated by single spaces and s is never empty.',
    [{ args: A('one'), expected: 1 }, { args: A('a b'), expected: 2 }, { args: A('the quick brown fox'), expected: 4 }],
    'Read one line. Words are separated by single spaces. Print the number of words.',
    [{ input: 'one', output: '1' }, { input: 'a b', output: '2' }, { input: 'the quick brown fox', output: '4' }]),

  mk('Sum of digits', 'digits', 'n',
    'Write digits(n) that returns the sum of the digits of a non-negative whole number n.',
    [{ args: A(1234), expected: 10 }, { args: A(0), expected: 0 }, { args: A(99999), expected: 45 }],
    'Read a non-negative whole number. Print the sum of its digits.',
    [{ input: '1234', output: '10' }, { input: '0', output: '0' }, { input: '99999', output: '45' }]),

  mk('Keep the evens', 'evens', 'nums',
    'Write evens(nums) that returns only the even numbers, in their original order.',
    [{ args: A([1, 2, 3, 4, 5]), expected: [2, 4] }, { args: A([10, 20, 30, 40]), expected: [10, 20, 30, 40] }, { args: A([7, 8, 9]), expected: [8] }],
    'The first line is n. The second line has n integers. Print only the even ones, separated by single spaces, in the original order.',
    [{ input: '5\n1 2 3 4 5', output: '2 4' }, { input: '4\n10 20 30 40', output: '10 20 30 40' }, { input: '3\n7 8 9', output: '8' }]),

  mk('Capitalize words', 'title', 's',
    'Write title(s) that capitalizes the first letter of every word. The input is lowercase with single spaces.',
    [{ args: A('hello world'), expected: 'Hello World' }, { args: A('a'), expected: 'A' }, { args: A('the quick brown fox'), expected: 'The Quick Brown Fox' }],
    'Read one lowercase line with single spaces. Print it with the first letter of every word capitalized.',
    [{ input: 'hello world', output: 'Hello World' }, { input: 'a', output: 'A' }, { input: 'the quick brown fox', output: 'The Quick Brown Fox' }]),

  mk('Fibonacci', 'fib', 'n',
    'Write fib(n) that returns the nth Fibonacci number, where fib(0) is 0 and fib(1) is 1.',
    [{ args: A(0), expected: 0 }, { args: A(1), expected: 1 }, { args: A(10), expected: 55 }, { args: A(20), expected: 6765 }],
    'Read n (0 to 30). Print the nth Fibonacci number, where fib(0) is 0 and fib(1) is 1.',
    [{ input: '0', output: '0' }, { input: '1', output: '1' }, { input: '10', output: '55' }, { input: '20', output: '6765' }]),

  mk('Remove duplicates', 'unique', 'nums',
    'Write unique(nums) that removes duplicates but keeps the first occurrence of each value, in order.',
    [{ args: A([1, 2, 2, 3, 1]), expected: [1, 2, 3] }, { args: A([5, 5, 5]), expected: [5] }, { args: A([4, 3, 2, 1]), expected: [4, 3, 2, 1] }],
    'The first line is n. The second line has n integers. Print them without duplicates (keep the first occurrence), separated by single spaces.',
    [{ input: '5\n1 2 2 3 1', output: '1 2 3' }, { input: '3\n5 5 5', output: '5' }, { input: '4\n4 3 2 1', output: '4 3 2 1' }])
];