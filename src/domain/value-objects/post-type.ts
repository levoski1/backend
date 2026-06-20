export enum PostType {
  GENERAL = 'general',
  PRAYER_REQUEST = 'prayer_request',
  DEVOTIONAL_SHARE = 'devotional_share',
  SCRIPTURE = 'scripture',
}

export function postTypeFromString(value: string): PostType {
  switch (value) {
    case 'general':
      return PostType.GENERAL;
    case 'prayer_request':
      return PostType.PRAYER_REQUEST;
    case 'devotional_share':
      return PostType.DEVOTIONAL_SHARE;
    case 'scripture':
      return PostType.SCRIPTURE;
    default:
      throw new Error(`Invalid post type: ${value}`);
  }
}
