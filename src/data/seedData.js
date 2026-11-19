// Pre-seeded synthetic dataset for Code Mentor.
// Loaded into localStorage by storageService on first run (or after "Reset Demo Data").

export const TOPICS = ['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Dynamic Programming', 'Graphs'];
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
];

const PY_TYPES = { int: 'int', bool: 'bool', str: 'str', 'int[]': 'List[int]', 'int[][]': 'List[List[int]]', 'char[][]': 'List[List[str]]', 'str[]': 'List[str]', ListNode: 'Optional[ListNode]', 'ListNode[]': 'List[Optional[ListNode]]', TreeNode: 'Optional[TreeNode]' };
const JAVA_TYPES = { int: 'int', bool: 'boolean', str: 'String', 'int[]': 'int[]', 'int[][]': 'int[][]', 'char[][]': 'char[][]', 'str[]': 'List<String>', ListNode: 'ListNode', 'ListNode[]': 'ListNode[]', TreeNode: 'TreeNode', 'List<List<int>>': 'List<List<Integer>>' };
const CPP_TYPES = { int: 'int', bool: 'bool', str: 'string', 'int[]': 'vector<int>&', 'int[][]': 'vector<vector<int>>&', 'char[][]': 'vector<vector<char>>&', 'str[]': 'vector<string>&', ListNode: 'ListNode*', 'ListNode[]': 'vector<ListNode*>&', TreeNode: 'TreeNode*', 'List<List<int>>': 'vector<vector<int>>' };
const CPP_RET = { ...CPP_TYPES, 'int[]': 'vector<int>' };
const PY_RET = { ...PY_TYPES, 'List<List<int>>': 'List[List[int]]' };

const LIST_NODE = {
  javascript: '/**\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n',
  python: '# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\n',
  java: '/**\n * public class ListNode { int val; ListNode next; }\n */\n',
  cpp: '/**\n * struct ListNode { int val; ListNode *next; };\n */\n',
};
const TREE_NODE = {
  javascript: '/**\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\n',
  python: '# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\n',
  java: '/**\n * public class TreeNode { int val; TreeNode left; TreeNode right; }\n */\n',
  cpp: '/**\n * struct TreeNode { int val; TreeNode *left; TreeNode *right; };\n */\n',
};

/** Build LeetCode-style starter code for all four languages from one signature. */
export function makeStarter(fn, params, ret, header = null) {
  const pre = (lang) => (header ? header[lang] : '');
  const js = `${pre('javascript')}/**\n${params.map(([n, t]) => ` * @param {${t}} ${n}`).join('\n')}\n * @return {${ret}}\n */\nvar ${fn} = function(${params.map(([n]) => n).join(', ')}) {\n    \n};`;
  const py = `${pre('python')}class Solution:\n    def ${fn}(self, ${params.map(([n, t]) => `${n}: ${PY_TYPES[t]}`).join(', ')}) -> ${PY_RET[ret]}:\n        pass`;
  const java = `${pre('java')}class Solution {\n    public ${JAVA_TYPES[ret]} ${fn}(${params.map(([n, t]) => `${JAVA_TYPES[t]} ${n}`).join(', ')}) {\n        \n    }\n}`;
  const cpp = `${pre('cpp')}class Solution {\npublic:\n    ${CPP_RET[ret]} ${fn}(${params.map(([n, t]) => `${CPP_TYPES[t]} ${n}`).join(', ')}) {\n        \n    }\n};`;
  return { javascript: js, python: py, java, cpp };
}

export const SEED_PROBLEMS = [
  // ───────────────────────── Arrays ─────────────────────────
  {
    id: 1, title: 'Two Sum', topic: 'Arrays', difficulty: 'Easy', acceptanceRate: 52.4,
    description: 'Given an array of integers `nums` and an integer `target`, return *indices of the two numbers such that they add up to `target`*.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
    starterCode: makeStarter('twoSum', [['nums', 'int[]'], ['target', 'int']], 'int[]'),
    expectedKeywords: ['map', 'for', 'return'],
    hints: [
      'Intuition: for every number x, the number you need is (target - x). Can you look it up faster than scanning the whole array again?',
      'Approach: use a Hash Map that stores value → index for every element you have already seen.',
      'Algorithm: iterate i from 0..n-1 → compute need = target - nums[i] → if need is in the map, return [map[need], i] → otherwise store map[nums[i]] = i. One pass, O(n) time.',
    ],
  },
  {
    id: 2, title: 'Best Time to Buy and Sell Stock', topic: 'Arrays', difficulty: 'Easy', acceptanceRate: 54.1,
    description: 'You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.\n\nReturn *the maximum profit you can achieve from this transaction*. If you cannot achieve any profit, return `0`.',
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.' },
      { input: 'prices = [7,6,4,3,1]', output: '0', explanation: 'No transactions are done and the max profit = 0.' },
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    starterCode: makeStarter('maxProfit', [['prices', 'int[]']], 'int'),
    expectedKeywords: ['min', 'max', 'for'],
    hints: [
      'Intuition: the best sell day for any buy day is simply the highest price that comes after it.',
      'Approach: keep a running minimum price seen so far — no extra data structure needed.',
      'Algorithm: minPrice = ∞, best = 0 → for each price: minPrice = min(minPrice, price); best = max(best, price - minPrice) → return best.',
    ],
  },
  {
    id: 3, title: 'Maximum Subarray', topic: 'Arrays', difficulty: 'Medium', acceptanceRate: 50.8,
    description: 'Given an integer array `nums`, find the subarray with the largest sum, and return *its sum*.',
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]', output: '1' },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    starterCode: makeStarter('maxSubArray', [['nums', 'int[]']], 'int'),
    expectedKeywords: ['max', 'for', 'return'],
    hints: [
      'Intuition: if the running sum ever becomes negative, it can only hurt any subarray that continues from it.',
      'Approach: Kadane\'s algorithm — a greedy / DP scan that tracks the best sum ending at the current index.',
      'Algorithm: cur = best = nums[0] → for i in 1..n-1: cur = max(nums[i], cur + nums[i]); best = max(best, cur) → return best.',
    ],
  },
  {
    id: 4, title: 'Trapping Rain Water', topic: 'Arrays', difficulty: 'Hard', acceptanceRate: 61.2,
    description: 'Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.',
    examples: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: '6 units of rain water are trapped between the bars.' },
      { input: 'height = [4,2,0,3,2,5]', output: '9' },
    ],
    constraints: ['n == height.length', '1 <= n <= 2 * 10^4', '0 <= height[i] <= 10^5'],
    starterCode: makeStarter('trap', [['height', 'int[]']], 'int'),
    expectedKeywords: ['while', 'max', 'left', 'right'],
    hints: [
      'Intuition: water above bar i = min(tallest bar on the left, tallest bar on the right) - height[i].',
      'Approach: Two Pointers moving inward, each remembering the max height seen from its side.',
      'Algorithm: l=0, r=n-1, lMax=rMax=0 → while l<r: if height[l] < height[r] { lMax=max(lMax,height[l]); water += lMax-height[l]; l++ } else { mirror on the right; r-- } → return water.',
    ],
  },
  // ───────────────────────── Strings ─────────────────────────
  {
    id: 5, title: 'Valid Palindrome', topic: 'Strings', difficulty: 'Easy', acceptanceRate: 47.9,
    description: 'A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `true` *if it is a palindrome, or* `false` *otherwise*.',
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 's = "race a car"', output: 'false', explanation: '"raceacar" is not a palindrome.' },
    ],
    constraints: ['1 <= s.length <= 2 * 10^5', 's consists only of printable ASCII characters.'],
    starterCode: makeStarter('isPalindrome', [['s', 'str']], 'bool'),
    expectedKeywords: ['while', 'lower', 'return'],
    hints: [
      'Intuition: a palindrome mirrors itself — compare characters from both ends.',
      'Approach: Two Pointers, skipping characters that are not letters or digits.',
      'Algorithm: l=0, r=n-1 → while l<r: skip non-alphanumerics on both sides → if lower(s[l]) != lower(s[r]) return false → l++, r-- → return true.',
    ],
  },
  {
    id: 6, title: 'Valid Anagram', topic: 'Strings', difficulty: 'Easy', acceptanceRate: 64.3,
    description: 'Given two strings `s` and `t`, return `true` *if* `t` *is an anagram of* `s`*, and* `false` *otherwise*.\n\nAn **anagram** is a word formed by rearranging the letters of another word, using all the original letters exactly once.',
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true' },
      { input: 's = "rat", t = "car"', output: 'false' },
    ],
    constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters.'],
    starterCode: makeStarter('isAnagram', [['s', 'str'], ['t', 'str']], 'bool'),
    expectedKeywords: ['count', 'for', 'length'],
    hints: [
      'Intuition: two words are anagrams exactly when every letter appears the same number of times.',
      'Approach: a frequency array of size 26 (or a Hash Map) for letter counts.',
      'Algorithm: if lengths differ return false → count[c]++ for c in s, count[c]-- for c in t → return true only if every count is 0.',
    ],
  },
  {
    id: 7, title: 'Longest Substring Without Repeating Characters', topic: 'Strings', difficulty: 'Medium', acceptanceRate: 35.6,
    description: 'Given a string `s`, find the length of the **longest substring** without repeating characters.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "pwwkew"', output: '3', explanation: 'The answer is "wke", with the length of 3.' },
    ],
    constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    starterCode: makeStarter('lengthOfLongestSubstring', [['s', 'str']], 'int'),
    expectedKeywords: ['set', 'while', 'max'],
    hints: [
      'Intuition: once you see a repeated character, the window must start after its previous occurrence.',
      'Approach: Sliding Window with a Hash Set (or a map of last-seen indices).',
      'Algorithm: l=0 → for r in 0..n-1: while s[r] in set { remove s[l]; l++ } → add s[r] → best = max(best, r-l+1) → return best.',
    ],
  },
  // ───────────────────────── Linked Lists ─────────────────────────
  {
    id: 8, title: 'Reverse Linked List', topic: 'Linked Lists', difficulty: 'Easy', acceptanceRate: 76.8,
    description: 'Given the `head` of a singly linked list, reverse the list, and return *the reversed list*.',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' },
    ],
    constraints: ['The number of nodes in the list is the range [0, 5000].', '-5000 <= Node.val <= 5000'],
    starterCode: makeStarter('reverseList', [['head', 'ListNode']], 'ListNode', LIST_NODE),
    expectedKeywords: ['next', 'prev', 'while'],
    hints: [
      'Intuition: you only need to flip each node\'s `next` pointer to point backwards.',
      'Approach: three pointers — prev, curr and a saved next.',
      'Algorithm: prev=null, curr=head → while curr: nxt=curr.next; curr.next=prev; prev=curr; curr=nxt → return prev.',
    ],
  },
  {
    id: 9, title: 'Merge Two Sorted Lists', topic: 'Linked Lists', difficulty: 'Easy', acceptanceRate: 65.2,
    description: 'You are given the heads of two sorted linked lists `list1` and `list2`.\n\nMerge the two lists into one **sorted** list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn *the head of the merged linked list*.',
    examples: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' },
      { input: 'list1 = [], list2 = [0]', output: '[0]' },
    ],
    constraints: ['The number of nodes in both lists is in the range [0, 50].', '-100 <= Node.val <= 100', 'Both lists are sorted in non-decreasing order.'],
    starterCode: makeStarter('mergeTwoLists', [['list1', 'ListNode'], ['list2', 'ListNode']], 'ListNode', LIST_NODE),
    expectedKeywords: ['dummy', 'next', 'while'],
    hints: [
      'Intuition: the smaller of the two current heads must always come next in the result.',
      'Approach: use a dummy head node and a tail pointer to build the merged list.',
      'Algorithm: dummy → tail → while both lists non-empty: attach the smaller node, advance it → attach whichever list remains → return dummy.next.',
    ],
  },
  {
    id: 10, title: 'Merge k Sorted Lists', topic: 'Linked Lists', difficulty: 'Hard', acceptanceRate: 53.9,
    description: 'You are given an array of `k` linked-lists `lists`, each linked-list is sorted in ascending order.\n\n*Merge all the linked-lists into one sorted linked-list and return it.*',
    examples: [
      { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' },
      { input: 'lists = []', output: '[]' },
    ],
    constraints: ['k == lists.length', '0 <= k <= 10^4', '0 <= lists[i].length <= 500', 'The sum of lists[i].length will not exceed 10^4.'],
    starterCode: makeStarter('mergeKLists', [['lists', 'ListNode[]']], 'ListNode', LIST_NODE),
    expectedKeywords: ['heap', 'merge', 'while'],
    hints: [
      'Intuition: at every step you need the smallest head among k lists — scanning all k each time is slow.',
      'Approach: a Min-Heap (priority queue) of list heads, or divide-and-conquer pairwise merging.',
      'Algorithm: push every non-null head into the heap → pop the smallest, attach it to the result, push its next → repeat until heap is empty. O(N log k).',
    ],
  },
  // ───────────────────────── Trees ─────────────────────────
  {
    id: 11, title: 'Maximum Depth of Binary Tree', topic: 'Trees', difficulty: 'Easy', acceptanceRate: 75.1,
    description: 'Given the `root` of a binary tree, return *its maximum depth*.\n\nA binary tree\'s **maximum depth** is the number of nodes along the longest path from the root node down to the farthest leaf node.',
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '3' },
      { input: 'root = [1,null,2]', output: '2' },
    ],
    constraints: ['The number of nodes in the tree is in the range [0, 10^4].', '-100 <= Node.val <= 100'],
    starterCode: makeStarter('maxDepth', [['root', 'TreeNode']], 'int', TREE_NODE),
    expectedKeywords: ['max', 'left', 'right'],
    hints: [
      'Intuition: the depth of a tree is 1 + the deeper of its two subtrees.',
      'Approach: Recursion (DFS); BFS level counting also works.',
      'Algorithm: if root is null return 0 → return 1 + max(maxDepth(root.left), maxDepth(root.right)).',
    ],
  },
  {
    id: 12, title: 'Validate Binary Search Tree', topic: 'Trees', difficulty: 'Medium', acceptanceRate: 33.4,
    description: 'Given the `root` of a binary tree, *determine if it is a valid binary search tree (BST)*.\n\nA **valid BST** is defined as follows:\n- The left subtree of a node contains only nodes with keys **less than** the node\'s key.\n- The right subtree of a node contains only nodes with keys **greater than** the node\'s key.\n- Both the left and right subtrees must also be binary search trees.',
    examples: [
      { input: 'root = [2,1,3]', output: 'true' },
      { input: 'root = [5,1,4,null,null,3,6]', output: 'false', explanation: 'The root node\'s value is 5 but its right child\'s value is 4.' },
    ],
    constraints: ['The number of nodes in the tree is in the range [1, 10^4].', '-2^31 <= Node.val <= 2^31 - 1'],
    starterCode: makeStarter('isValidBST', [['root', 'TreeNode']], 'bool', TREE_NODE),
    expectedKeywords: ['min', 'max', 'left', 'right'],
    hints: [
      'Intuition: checking only a node against its direct children is not enough — every ancestor sets a bound.',
      'Approach: DFS that carries an allowed (low, high) range down the tree; or an in-order traversal that must be strictly increasing.',
      'Algorithm: valid(node, lo, hi): if !node return true → if !(lo < node.val < hi) return false → return valid(left, lo, node.val) && valid(right, node.val, hi).',
    ],
  },
  {
    id: 13, title: 'Binary Tree Level Order Traversal', topic: 'Trees', difficulty: 'Medium', acceptanceRate: 66.7,
    description: 'Given the `root` of a binary tree, return *the level order traversal of its nodes\' values*. (i.e., from left to right, level by level).',
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]' },
      { input: 'root = [1]', output: '[[1]]' },
    ],
    constraints: ['The number of nodes in the tree is in the range [0, 2000].', '-1000 <= Node.val <= 1000'],
    starterCode: makeStarter('levelOrder', [['root', 'TreeNode']], 'List<List<int>>', TREE_NODE),
    expectedKeywords: ['queue', 'while', 'push'],
    hints: [
      'Intuition: nodes on the same level should be processed together before going deeper.',
      'Approach: Breadth-First Search with a Queue.',
      'Algorithm: queue=[root] → while queue: size=len(queue); level=[] → pop size nodes, append values, enqueue their children → push level to result.',
    ],
  },
  // ───────────────────────── Dynamic Programming ─────────────────────────
  {
    id: 14, title: 'Climbing Stairs', topic: 'Dynamic Programming', difficulty: 'Easy', acceptanceRate: 52.6,
    description: 'You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?',
    examples: [
      { input: 'n = 2', output: '2', explanation: '1. 1 step + 1 step\n2. 2 steps' },
      { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1' },
    ],
    constraints: ['1 <= n <= 45'],
    starterCode: makeStarter('climbStairs', [['n', 'int']], 'int'),
    expectedKeywords: ['for', 'dp', 'return'],
    hints: [
      'Intuition: to reach step n, your last move was from step n-1 or step n-2.',
      'Approach: Dynamic Programming — this is the Fibonacci recurrence.',
      'Algorithm: a=1, b=1 → repeat n-1 times: (a, b) = (b, a+b) → return b. O(n) time, O(1) space.',
    ],
  },
  {
    id: 15, title: 'House Robber', topic: 'Dynamic Programming', difficulty: 'Medium', acceptanceRate: 50.3,
    description: 'You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed; adjacent houses have security systems connected and **will automatically contact the police if two adjacent houses were broken into on the same night**.\n\nGiven an integer array `nums` representing the amount of money of each house, return *the maximum amount of money you can rob tonight without alerting the police*.',
    examples: [
      { input: 'nums = [1,2,3,1]', output: '4', explanation: 'Rob house 1 (money = 1) and then rob house 3 (money = 3). Total = 1 + 3 = 4.' },
      { input: 'nums = [2,7,9,3,1]', output: '12' },
    ],
    constraints: ['1 <= nums.length <= 100', '0 <= nums[i] <= 400'],
    starterCode: makeStarter('rob', [['nums', 'int[]']], 'int'),
    expectedKeywords: ['max', 'for', 'dp'],
    hints: [
      'Intuition: at each house you either rob it (and skip the previous) or skip it.',
      'Approach: Dynamic Programming with dp[i] = best total using houses 0..i.',
      'Algorithm: prev2=0, prev1=0 → for x in nums: cur = max(prev1, prev2 + x); prev2 = prev1; prev1 = cur → return prev1.',
    ],
  },
  {
    id: 16, title: 'Coin Change', topic: 'Dynamic Programming', difficulty: 'Medium', acceptanceRate: 43.9,
    description: 'You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.',
    examples: [
      { input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1' },
      { input: 'coins = [2], amount = 3', output: '-1' },
    ],
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    starterCode: makeStarter('coinChange', [['coins', 'int[]'], ['amount', 'int']], 'int'),
    expectedKeywords: ['dp', 'min', 'for'],
    hints: [
      'Intuition: greedy (always take the biggest coin) fails — e.g. coins [1,3,4], amount 6.',
      'Approach: bottom-up DP where dp[a] = fewest coins to make amount a.',
      'Algorithm: dp = [0, ∞, ∞, ...] → for a in 1..amount, for c in coins: if c <= a: dp[a] = min(dp[a], dp[a-c] + 1) → return dp[amount] == ∞ ? -1 : dp[amount].',
    ],
  },
  {
    id: 17, title: 'Edit Distance', topic: 'Dynamic Programming', difficulty: 'Hard', acceptanceRate: 56.8,
    description: 'Given two strings `word1` and `word2`, return *the minimum number of operations required to convert `word1` to `word2`*.\n\nYou have the following three operations permitted on a word:\n- Insert a character\n- Delete a character\n- Replace a character',
    examples: [
      { input: 'word1 = "horse", word2 = "ros"', output: '3', explanation: 'horse -> rorse (replace h) -> rose (remove r) -> ros (remove e)' },
      { input: 'word1 = "intention", word2 = "execution"', output: '5' },
    ],
    constraints: ['0 <= word1.length, word2.length <= 500', 'word1 and word2 consist of lowercase English letters.'],
    starterCode: makeStarter('minDistance', [['word1', 'str'], ['word2', 'str']], 'int'),
    expectedKeywords: ['dp', 'min', 'for'],
    hints: [
      'Intuition: compare prefixes — the answer for (i, j) depends only on smaller prefixes.',
      'Approach: 2-D DP table dp[i][j] = edit distance between word1[0..i) and word2[0..j).',
      'Algorithm: dp[i][0]=i, dp[0][j]=j → if chars match dp[i][j]=dp[i-1][j-1] else 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) → return dp[m][n].',
    ],
  },
  // ───────────────────────── Graphs ─────────────────────────
  {
    id: 18, title: 'Number of Islands', topic: 'Graphs', difficulty: 'Medium', acceptanceRate: 59.7,
    description: 'Given an `m x n` 2D binary grid `grid` which represents a map of `\'1\'`s (land) and `\'0\'`s (water), return *the number of islands*.\n\nAn **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
    examples: [
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3' },
      { input: 'grid = [["1","1","1"],["0","1","0"],["1","1","1"]]', output: '1' },
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300', "grid[i][j] is '0' or '1'."],
    starterCode: makeStarter('numIslands', [['grid', 'char[][]']], 'int'),
    expectedKeywords: ['dfs', 'for', 'visited'],
    hints: [
      'Intuition: each time you discover unvisited land, you have found a new island — then "sink" all of it.',
      'Approach: DFS or BFS flood fill on the grid (grid cells are graph nodes, 4-directional edges).',
      'Algorithm: for every cell == "1": count++ and dfs(r, c) which marks the cell "0" and recurses into its 4 neighbours → return count.',
    ],
  },
  {
    id: 19, title: 'Course Schedule', topic: 'Graphs', difficulty: 'Medium', acceptanceRate: 46.5,
    description: 'There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [ai, bi]` indicates that you **must** take course `bi` first if you want to take course `ai`.\n\nReturn `true` if you can finish all courses. Otherwise, return `false`.',
    examples: [
      { input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true', explanation: 'Take course 0, then course 1.' },
      { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false', explanation: 'The two courses depend on each other — a cycle.' },
    ],
    constraints: ['1 <= numCourses <= 2000', '0 <= prerequisites.length <= 5000', 'All the pairs prerequisites[i] are unique.'],
    starterCode: makeStarter('canFinish', [['numCourses', 'int'], ['prerequisites', 'int[][]']], 'bool'),
    expectedKeywords: ['indegree', 'queue', 'graph'],
    hints: [
      'Intuition: you can finish all courses exactly when the prerequisite graph has no cycle.',
      'Approach: Topological sort (Kahn\'s BFS with in-degrees) or DFS cycle detection with 3 colours.',
      'Algorithm: build adjacency list + indegree → queue all nodes with indegree 0 → pop, count++, decrement neighbours, enqueue new zeros → return count == numCourses.',
    ],
  },
  {
    id: 20, title: 'Word Ladder', topic: 'Graphs', difficulty: 'Hard', acceptanceRate: 39.2,
    description: 'A **transformation sequence** from word `beginWord` to word `endWord` using a dictionary `wordList` is a sequence of words such that every adjacent pair differs by a single letter and every word is in `wordList`.\n\nGiven two words, `beginWord` and `endWord`, and a dictionary `wordList`, return *the **number of words** in the **shortest transformation sequence** from* `beginWord` *to* `endWord`*, or* `0` *if no such sequence exists.*',
    examples: [
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: '5', explanation: '"hit" -> "hot" -> "dot" -> "dog" -> "cog"' },
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]', output: '0' },
    ],
    constraints: ['1 <= beginWord.length <= 10', 'endWord.length == beginWord.length', '1 <= wordList.length <= 5000', 'All the words in wordList are unique.'],
    starterCode: makeStarter('ladderLength', [['beginWord', 'str'], ['endWord', 'str'], ['wordList', 'str[]']], 'int'),
    expectedKeywords: ['queue', 'set', 'while'],
    hints: [
      'Intuition: every word is a node; words differing by one letter are connected. You need the shortest path.',
      'Approach: Breadth-First Search over words, using a Set of unvisited dictionary words.',
      'Algorithm: queue=[(beginWord,1)] → pop word → for each position try a..z → if the new word is endWord return steps+1; if in the set, remove it and enqueue (newWord, steps+1) → return 0.',
    ],
  },
];

export const DEMO_ACCOUNTS = [
  { id: 'u_student', name: 'Priya Sharma', email: 'student@codementor.edu', password: 'student123', role: 'student' },
  { id: 'u_alex', name: 'Alex Johnson', email: 'alex@codementor.edu', password: 'alex123', role: 'student' },
  { id: 'u_admin', name: 'Dr. Admin', email: 'admin@codementor.edu', password: 'admin123', role: 'admin' },
];

// Extra leaderboard peers so the leaderboard looks alive.
const PEERS = [
  { id: 'u_rohan', name: 'Rohan Mehta', email: 'rohan@codementor.edu', password: 'rohan123', role: 'student', solved: [1, 2, 5, 6, 8, 9, 11, 14, 15, 3, 18, 16], days: 9 },
  { id: 'u_sara', name: 'Sara Khan', email: 'sara@codementor.edu', password: 'sara123', role: 'student', solved: [1, 5, 8, 11, 14, 2], days: 3 },
  { id: 'u_dev', name: 'Dev Patel', email: 'dev@codementor.edu', password: 'dev123', role: 'student', solved: [1, 14], days: 1 },
];

const DAY = 86400000;

/** Build a fresh database snapshot. Timestamps are relative to `now` so streaks are "live". */
export function buildSeedDatabase(now = Date.now()) {
  const problems = SEED_PROBLEMS.map((p) => ({ ...p }));
  const byId = Object.fromEntries(problems.map((p) => [p.id, p]));
  const users = [...DEMO_ACCOUNTS, ...PEERS].map(({ solved, days, ...u }) => ({
    ...u,
    createdAt: new Date(now - 30 * DAY).toISOString(),
  }));

  // Midnight-safe timestamps: past days land at ~10:00 local time, "today" never before 00:00.
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const seedTime = (daysAgo, minutes) => {
    if (daysAgo === 0) return Math.max(startOfToday.getTime() + 60000, now - minutes * 60000);
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - daysAgo);
    return d.getTime() + 10 * 3600000 + minutes * 60000;
  };

  const submissions = [];
  let seq = 1;
  const sub = (userId, problemId, status, daysAgo, minutes = 0, language = 'javascript') => {
    const p = byId[problemId];
    submissions.push({
      id: `s_seed_${seq++}`,
      userId, problemId, title: p.title, topic: p.topic, difficulty: p.difficulty, language, status,
      runtime: status === 'Accepted' ? 48 + ((problemId * 13) % 60) : null,
      memory: status === 'Accepted' ? +(41 + ((problemId * 7) % 9) + 0.3).toFixed(1) : null,
      code: '', source: 'workspace',
      timestamp: seedTime(daysAgo, minutes),
    });
  };

  // Priya (student@codementor.edu): 4-day active streak (solving today makes it 5); Arrays pre-flagged weak (1/3 = 33%, 2 mistakes).
  sub('u_student', 14, 'Accepted', 4, 30);
  sub('u_student', 5, 'Wrong Answer', 4, 20, 'python');
  sub('u_student', 5, 'Accepted', 4, 10, 'python');
  sub('u_student', 8, 'Accepted', 3, 50);
  sub('u_student', 11, 'Accepted', 3, 40);
  sub('u_student', 1, 'Accepted', 2, 60);
  sub('u_student', 6, 'Accepted', 2, 30, 'python');
  sub('u_student', 15, 'Accepted', 1, 90, 'java');
  sub('u_student', 3, 'Wrong Answer', 1, 45);
  sub('u_student', 18, 'Accepted', 1, 20, 'cpp');
  sub('u_student', 2, 'Wrong Answer', 0, 30);

  // Peers
  PEERS.forEach((peer) => {
    peer.solved.forEach((pid, i) => sub(peer.id, pid, 'Accepted', Math.max(0, peer.days - 1 - (i % peer.days)), 15 + i));
  });
  sub('u_rohan', 4, 'Wrong Answer', 2, 5);
  sub('u_sara', 7, 'Wrong Answer', 1, 5, 'python');
  sub('u_sara', 7, 'Wrong Answer', 1, 3, 'python');
  sub('u_dev', 12, 'Wrong Answer', 0, 8);

  const progress = {};
  users.forEach((u) => {
    progress[u.id] = { dailyGoal: 3, dayOffset: 0, hintsRevealed: {} };
  });
  progress.u_student.hintsRevealed = { 3: 1 };

  return {
    version: 1,
    users,
    problems,
    submissions: submissions.sort((a, b) => a.timestamp - b.timestamp),
    progress,
    practiceSessions: [],
    nextProblemId: 21,
  };
}
