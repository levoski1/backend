import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../../../config/env.js';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Shelter API',
    version: '0.1.0',
    description: 'A Digital Sanctuary for Faith and Mental Health — REST API documentation',
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
      description: 'Development server',
    },
    ...(env.RENDER_EXTERNAL_URL
      ? [{ url: `${env.RENDER_EXTERNAL_URL}${env.API_PREFIX}`, description: 'Production server' }]
      : []),
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              details: { type: 'object' },
            },
          },
          meta: {
            type: 'object',
            properties: {
              requestId: { type: 'string', format: 'uuid' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: 'JWT access token (short-lived)' },
          refreshToken: { type: 'string', description: 'JWT refresh token (long-lived)' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          authProvider: { type: 'string', enum: ['local', 'google', 'apple'] },
          accountStatus: { type: 'string', enum: ['active', 'suspended', 'deactivated'] },
          emailVerified: { type: 'boolean' },
          phoneNumber: { type: 'string', nullable: true, example: '+1234567890' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['fullName', 'email', 'password'],
        properties: {
          fullName: { type: 'string', minLength: 2, maxLength: 50, example: 'Jane Doe' },
          email: { type: 'string', format: 'email', maxLength: 255, example: 'shelterfaithapps@gmail.com' },
          password: { type: 'string', minLength: 8, maxLength: 128, example: 'securePass123' },
          phoneNumber: { type: 'string', nullable: true, example: '+1234567890', description: 'Optional phone number' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'shelterfaithapps@gmail.com' },
          password: { type: 'string', example: 'securePass123' },
        },
      },
      RefreshInput: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', description: 'JWT refresh token' },
        },
      },
      LogoutInput: {
        type: 'object',
        properties: {
          refreshToken: { type: 'string', description: 'JWT refresh token to invalidate' },
        },
      },
      VerifyEmailInput: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: '6-digit verification code sent to email', pattern: '^\\d{6}$' },
        },
      },
      ResendVerificationInput: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'shelterfaithapps@gmail.com', description: 'Email address to resend verification to' },
        },
      },
      ForgotPasswordInput: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'shelterfaithapps@gmail.com', description: 'Email address to receive password reset OTP' },
        },
      },
      VerifyResetOtpInput: {
        type: 'object',
        required: ['email', 'otp'],
        properties: {
          email: { type: 'string', format: 'email', example: 'shelterfaithapps@gmail.com', description: 'Email address' },
          otp: { type: 'string', description: '6-digit OTP from email', pattern: '^\\d{6}$' },
        },
      },
      VerifyResetOtpResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              resetToken: { type: 'string', description: 'Temporary JWT token for password reset (expires in 5 minutes)' },
            },
          },
          meta: {
            type: 'object',
            properties: {
              requestId: { type: 'string', format: 'uuid' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      ResetPasswordInput: {
        type: 'object',
        required: ['resetToken', 'password'],
        properties: {
          resetToken: { type: 'string', description: 'Temporary reset token from verify-reset-otp endpoint' },
          password: { type: 'string', minLength: 8, maxLength: 128, example: 'newSecurePass123', description: 'New password (min 8 characters)' },
        },
      },
      PublicProfile: {
        type: 'object',
        properties: {
          displayName: { type: 'string', example: 'GraceWilson' },
          bio: { type: 'string', nullable: true, example: 'Finding strength in scripture and community.' },
          avatarUrl: { type: 'string', nullable: true, format: 'uri' },
          denomination: { type: 'string', nullable: true, example: 'Non-denominational' },
          spiritualInterests: { type: 'array', items: { type: 'string' }, example: ['prayer', 'bible-study', 'worship'] },
          timezone: { type: 'string', example: 'America/New_York' },
        },
      },
      FullProfile: {
        type: 'object',
        allOf: [
          { $ref: '#/components/schemas/PublicProfile' },
          {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              fullName: { type: 'string', example: 'Grace Wilson' },
              email: { type: 'string', format: 'email' },
              phoneNumber: { type: 'string', nullable: true, example: '+1234567890' },
              privacySettings: { $ref: '#/components/schemas/PrivacySettings' },
              accountStatus: { type: 'string', enum: ['active', 'suspended', 'banned'] },
              authProvider: { type: 'string', enum: ['email', 'google', 'apple'] },
              emailVerified: { type: 'boolean' },
            },
          },
        ],
      },
      PrivacySettings: {
        type: 'object',
        properties: {
          profileVisibility: { type: 'string', enum: ['public', 'private'], example: 'public' },
          showFaithInfo: { type: 'boolean', example: true },
          anonymousPosting: { type: 'boolean', example: false },
        },
      },
      UpdateProfileInput: {
        type: 'object',
        properties: {
          displayName: { type: 'string', minLength: 2, maxLength: 50, example: 'GraceWilson', description: 'Display name (2-50 chars)' },
          bio: { type: 'string', maxLength: 500, example: 'Finding strength in scripture and community.', description: 'Short bio (max 500 chars)' },
          denomination: { type: 'string', minLength: 2, maxLength: 100, example: 'Non-denominational', description: 'Denomination (2-100 chars)' },
          spiritualInterests: { type: 'array', items: { type: 'string' }, example: ['prayer', 'bible-study'], description: 'List of spiritual interests (max 20)' },
          timezone: { type: 'string', example: 'America/New_York', description: 'Timezone string' },
        },
      },
      UpdatePrivacyInput: {
        type: 'object',
        properties: {
          profileVisibility: { type: 'string', enum: ['public', 'private'], description: 'Who can see your profile' },
          showFaithInfo: { type: 'boolean', description: 'Show faith/denomination info on profile' },
          anonymousPosting: { type: 'boolean', description: 'Post anonymously in the community feed' },
        },
      },
      UpdateSettingsInput: {
        type: 'object',
        properties: {
          prayerReminders: { type: 'boolean', description: 'Receive prayer reminders' },
          communityUpdates: { type: 'boolean', description: 'Receive community updates' },
          streakAlerts: { type: 'boolean', description: 'Receive streak alerts' },
        },
      },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Post UUID' },
          userId: { type: 'string', format: 'uuid', description: 'Author user UUID' },
          content: { type: 'string', description: 'Post content (max 5000 chars)' },
          isAnonymous: { type: 'boolean', description: 'Whether the post is anonymous' },
          isUrgent: { type: 'boolean', description: 'Whether the post is urgent (prayer posts only)' },
          allowComments: { type: 'boolean', description: 'Whether comments are allowed' },
          postType: { type: 'string', enum: ['prayer', 'advice', 'testimony', 'gratitude'], description: 'Type of post' },
          authorDisplayName: { type: 'string', description: "Display name (returns 'A Shelter Member' for anonymous)" },
          authorAvatarUrl: { type: 'string', format: 'uri', nullable: true, description: 'Author avatar URL (null for anonymous)' },
          commentCount: { type: 'integer', description: 'Total comment count' },
          reactionCounts: {
            type: 'object',
            properties: {
              prayer: { type: 'integer' },
              heart: { type: 'integer' },
              amen: { type: 'integer' },
            },
            description: 'Reaction counts per type',
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreatePostInput: {
        type: 'object',
        required: ['content', 'postType'],
        properties: {
          content: { type: 'string', minLength: 1, maxLength: 5000, description: 'Post content (1-5000 chars)' },
          isAnonymous: { type: 'boolean', default: false, description: 'Post anonymously' },
          allowComments: { type: 'boolean', default: true, description: 'Allow comments on this post' },
          isUrgent: { type: 'boolean', description: 'Mark prayer post as urgent (only allowed for prayer posts)' },
          postType: { type: 'string', enum: ['prayer', 'advice', 'testimony', 'gratitude'], description: 'Type of post' },
        },
      },
      UpdatePostInput: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', minLength: 1, maxLength: 5000, description: 'Updated post content (1-5000 chars)' },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Comment UUID' },
          postId: { type: 'string', format: 'uuid', description: 'Parent post UUID' },
          userId: { type: 'string', format: 'uuid', description: 'Author user UUID' },
          content: { type: 'string', description: 'Comment content (max 1000 chars)' },
          isAnonymous: { type: 'boolean', description: 'Whether the comment is anonymous' },
          authorDisplayName: { type: 'string', description: "Display name (returns 'A Shelter Member' for anonymous)" },
          authorAvatarUrl: { type: 'string', format: 'uri', nullable: true, description: 'Author avatar URL (null for anonymous)' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateCommentInput: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', minLength: 1, maxLength: 1000, description: 'Comment content (1-1000 chars)' },
          isAnonymous: { type: 'boolean', default: false, description: 'Comment anonymously' },
        },
      },
      AddReactionInput: {
        type: 'object',
        required: ['reactionType'],
        properties: {
          reactionType: { type: 'string', enum: ['prayer', 'heart', 'amen'], description: 'Type of reaction' },
        },
      },
      Devotional: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Devotional UUID' },
          title: { type: 'string', description: 'Devotional title' },
          scriptureReference: { type: 'string', description: 'Scripture reference (e.g. John 3:16)' },
          scriptureText: { type: 'string', description: 'Full scripture text' },
          reflection: { type: 'string', description: 'Reflection on the scripture' },
          closingPrayer: { type: 'string', description: 'Closing prayer text' },
          publishedDate: { type: 'string', format: 'date', description: 'Published date (YYYY-MM-DD)' },
          author: { type: 'string', description: 'Author of the devotional' },
          isPublished: { type: 'boolean', description: 'Whether the devotional is published' },
          isCompleted: { type: 'boolean', description: 'Whether the user has completed this devotional (only when authenticated)' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateDevotionalInput: {
        type: 'object',
        required: ['title', 'scriptureReference', 'scriptureText', 'reflection', 'closingPrayer', 'publishedDate'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255, description: 'Devotional title' },
          scriptureReference: { type: 'string', minLength: 1, maxLength: 255, description: 'Scripture reference (e.g. John 3:16)' },
          scriptureText: { type: 'string', description: 'Full scripture text' },
          reflection: { type: 'string', description: 'Reflection on the scripture' },
          closingPrayer: { type: 'string', description: 'Closing prayer text' },
          publishedDate: { type: 'string', format: 'date', description: 'Published date (YYYY-MM-DD)' },
          author: { type: 'string', description: 'Author of the devotional', default: 'Shelter Team' },
          isPublished: { type: 'boolean', default: true, description: 'Whether the devotional is published' },
        },
      },
      UpdateDevotionalInput: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255, description: 'Devotional title' },
          scriptureReference: { type: 'string', minLength: 1, maxLength: 255, description: 'Scripture reference' },
          scriptureText: { type: 'string', description: 'Full scripture text' },
          reflection: { type: 'string', description: 'Reflection on the scripture' },
          closingPrayer: { type: 'string', description: 'Closing prayer text' },
          publishedDate: { type: 'string', format: 'date', description: 'Published date (YYYY-MM-DD)' },
          author: { type: 'string', description: 'Author of the devotional' },
          isPublished: { type: 'boolean', description: 'Whether the devotional is published' },
        },
      },
      DevotionalArchiveItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Devotional UUID' },
          title: { type: 'string', description: 'Devotional title' },
          scriptureReference: { type: 'string', description: 'Scripture reference' },
          publishedDate: { type: 'string', format: 'date', description: 'Published date' },
          author: { type: 'string', description: 'Author' },
          isCompleted: { type: 'boolean', description: 'Whether the user has completed this devotional' },
        },
      },
      Streak: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', nullable: true, description: 'Streak UUID (null if no activity yet)' },
          userId: { type: 'string', format: 'uuid', description: 'User UUID' },
          disciplineType: { type: 'string', enum: ['devotional', 'prayer', 'scripture_reading'], description: 'Type of discipline' },
          currentStreak: { type: 'integer', description: 'Current consecutive days' },
          longestStreak: { type: 'integer', description: 'Longest streak ever achieved' },
          lastCompletedDate: { type: 'string', format: 'date', nullable: true, description: 'Last completion date' },
          graceDayUsed: { type: 'boolean', description: 'Whether grace day has been used this week' },
          milestones: {
            type: 'array',
            items: { $ref: '#/components/schemas/StreakMilestone' },
            description: 'Milestone achievements',
          },
        },
      },
      StreakMilestone: {
        type: 'object',
        properties: {
          milestone: { type: 'integer', description: 'Milestone day count (7, 14, 30, 60, 90)' },
          reached: { type: 'boolean', description: 'Whether this milestone has been reached' },
        },
      },
    },
  },
};

const isDev = env.NODE_ENV === 'development';
const apis = isDev
  ? ['./src/interfaces/http/routes/*.ts']
  : ['./dist/interfaces/http/routes/*.js'];

const options = {
  swaggerDefinition,
  apis,
};

export const swaggerSpec = swaggerJsdoc(options);
