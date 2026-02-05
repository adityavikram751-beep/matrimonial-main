

export const report = [
{
  id: 'RPT001',
  status: 'Pending', // or 'Approved', 'Rejected'
  reportedDate: '2025-07-20T14:30:00Z',
  reason: 'Inappropriate content',
  description: 'User posted offensive language in profile bio.',
  attachment: '/attachments/evidence1.png',
  totalReports: 3,
  reportedUser: {
    id: 'USR123',
    name: 'Ankit Kumar',
    gender: 'Male',
    avatar: '/avatars/ankit.png'
  },
  reporterUser: {
    id: 'USR456',
    name: 'Pooja Sharma',
    gender: 'Female',
    avatar: '/avatars/pooja.png'
  }
},
{
    id: 'RPT002',
    status: 'Approved',
    reportedDate: '2025-07-22T09:15:00Z',
    reason: 'Harassment',
    description: 'User sent inappropriate messages.',
    attachment: '/attachments/evidence2.jpg',
    totalReports: 5,
    reportedUser: {
      id: 'USR124',
      name: 'Rohit Singh',
      gender: 'Male',
      avatar: '/avatars/rohit.png'
    },
    reporterUser: {
      id: 'USR457',
      name: 'Sneha Verma',
      gender: 'Female',
      avatar: '/avatars/sneha.png'
    }
  },
  {
    id: 'RPT003',
    status: 'Rejected',
    reportedDate: '2025-07-23T11:45:00Z',
    reason: 'Fake profile',
    description: 'Profile image and name do not match real identity.',
    attachment: '/attachments/evidence3.png',
    totalReports: 2,
    reportedUser: {
      id: 'USR125',
      name: 'Karan Mehta',
      gender: 'Male',
      avatar: '/avatars/karan.png'
    },
    reporterUser: {
      id: 'USR458',
      name: 'Ritika Gupta',
      gender: 'Female',
      avatar: '/avatars/ritika.png'
    }
  },
  {
    id: 'RPT004',
    status: 'Pending',
    reportedDate: '2025-07-19T16:10:00Z',
    reason: 'Spam',
    description: 'Keeps sending promotional links.',
    attachment: '/attachments/evidence4.png',
    totalReports: 4,
    reportedUser: {
      id: 'USR126',
      name: 'Deepak Joshi',
      gender: 'Male',
      avatar: '/avatars/deepak.png'
    },
    reporterUser: {
      id: 'USR459',
      name: 'Neha Sharma',
      gender: 'Female',
      avatar: '/avatars/neha.png'
    }
  },
  {
    id: 'RPT005',
    status: 'Pending',
    reportedDate: '2025-07-18T13:00:00Z',
    reason: 'Inappropriate pictures',
    description: 'Uploaded NSFW images.',
    attachment: '/attachments/evidence5.jpg',
    totalReports: 6,
    reportedUser: {
      id: 'USR127',
      name: 'Suresh Raina',
      gender: 'Male',
      avatar: '/avatars/suresh.png'
    },
    reporterUser: {
      id: 'USR460',
      name: 'Isha Rawat',
      gender: 'Female',
      avatar: '/avatars/isha.png'
    }
  },
  {
    id: 'RPT006',
    status: 'Approved',
    reportedDate: '2025-07-21T10:25:00Z',
    reason: 'Offensive bio',
    description: 'Used hateful language in profile description.',
    attachment: '/attachments/evidence6.png',
    totalReports: 3,
    reportedUser: {
      id: 'USR128',
      name: 'Priyank Das',
      gender: 'Male',
      avatar: '/avatars/priyank.png'
    },
    reporterUser: {
      id: 'USR461',
      name: 'Aarti Mishra',
      gender: 'Female',
      avatar: '/avatars/aarti.png'
    }
  },
  {
    id: 'RPT007',
    status: 'Rejected',
    reportedDate: '2025-07-20T08:40:00Z',
    reason: 'False information',
    description: 'Claimed wrong job and salary details.',
    attachment: '/attachments/evidence7.jpg',
    totalReports: 1,
    reportedUser: {
      id: 'USR129',
      name: 'Manish Tiwari',
      gender: 'Male',
      avatar: '/avatars/manish.png'
    },
    reporterUser: {
      id: 'USR462',
      name: 'Simran Kaur',
      gender: 'Female',
      avatar: '/avatars/simran.png'
    }
  },
  {
    id: 'RPT008',
    status: 'Pending',
    reportedDate: '2025-07-22T14:50:00Z',
    reason: 'Multiple accounts',
    description: 'Appears to be using duplicate profiles.',
    attachment: '/attachments/evidence8.png',
    totalReports: 4,
    reportedUser: {
      id: 'USR130',
      name: 'Ajay Chauhan',
      gender: 'Male',
      avatar: '/avatars/ajay.png'
    },
    reporterUser: {
      id: 'USR463',
      name: 'Nikita Jain',
      gender: 'Female',
      avatar: '/avatars/nikita.png'
    }
  },
  {
    id: 'RPT009',
    status: 'Approved',
    reportedDate: '2025-07-17T17:20:00Z',
    reason: 'Misleading photos',
    description: 'Photos are overly edited and not real.',
    attachment: '/attachments/evidence9.png',
    totalReports: 2,
    reportedUser: {
      id: 'USR131',
      name: 'Rajat Kapoor',
      gender: 'Male',
      avatar: '/avatars/rajat.png'
    },
    reporterUser: {
      id: 'USR464',
      name: 'Tina Roy',
      gender: 'Female',
      avatar: '/avatars/tina.png'
    }
  },
  {
    id: 'RPT010',
    status: 'Rejected',
    reportedDate: '2025-07-16T19:35:00Z',
    reason: 'Abusive language',
    description: 'Used slurs in direct messages.',
    attachment: '/attachments/evidence10.jpg',
    totalReports: 5,
    reportedUser: {
      id: 'USR132',
      name: 'Harsh Vardhan',
      gender: 'Male',
      avatar: '/avatars/harsh.png'
    },
    reporterUser: {
      id: 'USR465',
      name: 'Meera Sinha',
      gender: 'Female',
      avatar: '/avatars/meera.png'
    }
  },
  {
    id: 'RPT011',
    status: 'Pending',
    reportedDate: '2025-07-24T12:10:00Z',
    reason: 'Profile impersonation',
    description: 'Using someone else’s identity.',
    attachment: '/attachments/evidence11.png',
    totalReports: 7,
    reportedUser: {
      id: 'USR133',
      name: 'Naveen Chauhan',
      gender: 'Male',
      avatar: '/avatars/naveen.png'
    },
    reporterUser: {
      id: 'USR466',
      name: 'Kavita Reddy',
      gender: 'Female',
      avatar: '/avatars/kavita.png'
    }
  },


]