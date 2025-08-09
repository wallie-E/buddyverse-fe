import type { User, Post, Comment, Notification } from '../types';

// 模拟用户数据
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'alex.chen@example.com',
    nickname: 'Alex Chen',
    avatar: '',
    gender: 'male',
    signature: '热爱生活，喜欢交朋友！寻找各种有趣的搭子，一起探索世界的美好～',
    role: 'user',
    registeredAt: '2024-01-15',
    postCount: 12,
    commentCount: 48
  },
  {
    id: '2',
    email: 'sarah.liu@example.com',
    nickname: 'Sarah Liu',
    avatar: '',
    gender: 'female',
    signature: '',
    role: 'user',
    registeredAt: '2024-01-20',
    postCount: 8,
    commentCount: 32
  },
  {
    id: '3',
    email: 'mike.zhang@example.com',
    nickname: 'Mike Zhang',
    avatar: '',
    gender: 'male',
    signature: '',
    role: 'user',
    registeredAt: '2024-01-10',
    postCount: 15,
    commentCount: 67
  },
  {
    id: '4',
    email: 'yuki.tanaka@example.com',
    nickname: 'Yuki Tanaka',
    avatar: '',
    gender: 'female',
    signature: '',
    role: 'user',
    registeredAt: '2024-01-25',
    postCount: 6,
    commentCount: 23
  }
];

// 模拟评论数据
export const mockComments: Comment[] = [
  {
    id: 'c1',
    content: '听起来很棒！什么时候约？我也是川菜爱好者！能吃特别辣的那种～',
    postId: 'p1',
    authorId: '2',
    author: mockUsers[1],
    createdAt: '2024-01-28T10:30:00Z'
  },
  {
    id: 'c2',
    content: '明天晚上7点怎么样？我们可以先在三里屯见面！那家店的麻辣锅底真的很正宗！',
    postId: 'p1',
    authorId: '1',
    author: mockUsers[0],
    parentId: 'c1',
    createdAt: '2024-01-28T11:00:00Z'
  },
  {
    id: 'c3',
    content: '我也想去！可以一起吗？我对重庆火锅很有研究，可以推荐一些好吃的菜品～',
    postId: 'p1',
    authorId: '3',
    author: mockUsers[2],
    createdAt: '2024-01-28T11:15:00Z'
  }
];

// 模拟帖子数据
export const mockPosts: Post[] = [
  {
    id: 'p1',
    content: '明天晚上想去吃正宗重庆火锅！找个能吃辣的搭子一起，我知道一家特别正宗的老店，麻辣鲜香，绝对过瘾！',
    location: '北京市朝阳区·三里屯',
    mainCategory: 'food',
    subCategory: 'food-hotpot',
    isPrivateComments: false,
    authorId: '1',
    author: mockUsers[0],
    createdAt: '2024-01-28T08:00:00Z',
    commentCount: 24,
    comments: mockComments
  },
  {
    id: 'p2',
    content: '周末想去找羽毛球搭起！我是中级水平，希望找个技术相当的搭子一起切磋，已经好久没打球了～',
    location: '上海市浦东新区·世纪公园',
    mainCategory: 'sports',
    subCategory: 'sports-badminton',
    isPrivateComments: false,
    authorId: '2',
    author: mockUsers[1],
    createdAt: '2024-01-28T06:00:00Z',
    commentCount: 18,
    comments: []
  },
  {
    id: 'p3',
    content: '想找个一起学习前端开发的搭子！我在学React和TypeScript，可以互相讨论技术问题，一起进步～',
    location: '深圳市南山区·科技园',
    mainCategory: 'study',
    subCategory: 'study-programming',
    isPrivateComments: false,
    authorId: '3',
    author: mockUsers[2],
    createdAt: '2024-01-28T04:00:00Z',
    commentCount: 32,
    comments: []
  },
  {
    id: 'p4',
    content: '王者荣耀五排队！我们是星耀段位，缺一个打野位置，要求技术过硬，配合默契～',
    location: '广州市天河区·天河城',
    mainCategory: 'game',
    subCategory: 'game-honor',
    isPrivateComments: false,
    authorId: '4',
    author: mockUsers[3],
    createdAt: '2024-01-28T02:00:00Z',
    commentCount: 15,
    comments: []
  },
  {
    id: 'p5',
    content: '寻找明天一起品尝正宗川菜火锅的美食搭子！新发现了一家口碑极佳的川菜馆，据说是成都师傅亲自掌勺，想找个懂美食的朋友一起去探店～',
    location: '北京市朝阳区·三里屯',
    mainCategory: 'food',
    subCategory: 'food-hotpot',
    isPrivateComments: false,
    authorId: '1',
    author: mockUsers[0],
    createdAt: '2024-01-27T10:00:00Z',
    commentCount: 24,
    comments: []
  },
  {
    id: 'p6',
    content: '周末想找人一起去图书馆学习，有没有考研的小伙伴？可以互相监督，一起进步！环境安静，氛围很好，期待遇到志同道合的学习搭子。',
    location: '北京市海淀区·国家图书馆',
    mainCategory: 'study',
    subCategory: 'study-english',
    isPrivateComments: false,
    authorId: '1',
    author: mockUsers[0],
    createdAt: '2024-01-26T14:00:00Z',
    commentCount: 12,
    comments: []
  },
  {
    id: 'p7',
    content: '新买了健身卡，想找个健身搭子一起去锻炼，互相鼓励坚持下去！我是健身新手，希望能找到有经验的朋友带带我～',
    location: '北京市朝阳区·威尔士健身',
    mainCategory: 'sports',
    subCategory: 'sports-running',
    isPrivateComments: false,
    authorId: '1',
    author: mockUsers[0],
    createdAt: '2024-01-25T16:00:00Z',
    commentCount: 18,
    comments: []
  }
];

// 模拟通知数据
export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'comment',
    postId: 'p1',
    commentId: 'c1',
    fromUserId: '2',
    fromUser: mockUsers[1],
    toUserId: '1',
    content: '听起来很棒！什么时候约？我也是川菜爱好者！',
    isRead: false,
    createdAt: '2024-01-28T10:30:00Z'
  },
  {
    id: 'n2',
    type: 'reply',
    postId: 'p1',
    commentId: 'c3',
    fromUserId: '3',
    fromUser: mockUsers[2],
    toUserId: '1',
    content: '我也想去！可以一起吗？我对重庆火锅很有研究...',
    isRead: false,
    createdAt: '2024-01-28T11:15:00Z'
  },
  {
    id: 'n3',
    type: 'reply',
    postId: 'p1',
    commentId: 'c2',
    fromUserId: '1',
    fromUser: mockUsers[0],
    toUserId: '2',
    content: '我也在准备面试！正好需要刷题搭子，可以一起讨论算法题～',
    isRead: true,
    createdAt: '2024-01-28T09:00:00Z'
  }
];

// 获取当前用户（模拟登录状态）
export const getCurrentUser = (): User => mockUsers[0];

// 获取未读通知数量
export const getUnreadNotificationCount = (): number => {
  return mockNotifications.filter(n => !n.isRead).length;
}; 