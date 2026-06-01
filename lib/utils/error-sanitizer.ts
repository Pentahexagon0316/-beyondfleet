/**
 * Utility to sanitize user-facing error messages, ensuring no raw stack traces,
 * webpack module loading failures, or user directory paths (/Users/yubbi) are leaked.
 */
export function sanitizeErrorMessage(message: string | null | undefined): string {
  if (!message) {
    return '콘텐츠를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }

  const forbiddenPatterns = [
    'runtime error',
    'cannot find module',
    '/users/yubbi',
    '.next/server',
    'stack trace',
    'require stack',
    'webpack-runtime',
    'node-environmental',
    'node_modules',
  ];

  const lowerMsg = message.toLowerCase();
  for (const pattern of forbiddenPatterns) {
    if (lowerMsg.includes(pattern)) {
      return '콘텐츠를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    }
  }

  return message;
}
