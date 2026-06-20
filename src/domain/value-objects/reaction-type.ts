export enum ReactionType {
  PRAYER = 'prayer',
  HEART = 'heart',
  AMEN = 'amen',
}

export function reactionTypeFromString(value: string): ReactionType {
  switch (value) {
    case 'prayer':
      return ReactionType.PRAYER;
    case 'heart':
      return ReactionType.HEART;
    case 'amen':
      return ReactionType.AMEN;
    default:
      throw new Error(`Invalid reaction type: ${value}`);
  }
}
