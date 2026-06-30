export enum PostType {
  PRAYER = 'prayer',
  ADVICE = 'advice',
  TESTIMONY = 'testimony',
  GRATITUDE = 'gratitude',
}

export function postTypeFromString(value: string): PostType {
  switch (value) {
    case 'prayer':
      return PostType.PRAYER;
    case 'advice':
      return PostType.ADVICE;
    case 'testimony':
      return PostType.TESTIMONY;
    case 'gratitude':
      return PostType.GRATITUDE;
    default:
      throw new Error(`Invalid post type: ${value}`);
  }
}
