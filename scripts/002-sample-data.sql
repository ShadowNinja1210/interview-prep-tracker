-- Insert sample pointers for testing
INSERT INTO pointers (title, topic, status, weightage, feedback_summary, action_steps) VALUES
('Implement Binary Search Tree traversal', 'DSA', 'in_progress', 8, 'Struggled with recursive implementation', 'Practice inorder, preorder, postorder traversals. Focus on recursive vs iterative approaches.'),
('Design URL Shortener service', 'System Design', 'not_started', 9, 'Need to understand distributed systems better', 'Study consistent hashing, database sharding, caching strategies, and rate limiting.'),
('Handle behavioral question about conflict resolution', 'Behavioral', 'completed', 6, 'Good STAR method usage', 'Continue practicing STAR format. Prepare more examples from different projects.'),
('Optimize database queries for large datasets', 'LLD', 'in_progress', 7, 'Query performance issues in mock interview', 'Learn indexing strategies, query optimization, and database design patterns.'),
('Implement LRU Cache', 'Coding', 'completed', 8, 'Solved efficiently using HashMap + DoublyLinkedList', 'Review time/space complexity analysis. Practice similar cache problems.'),
('Design microservices architecture', 'Architecture', 'not_started', 9, 'Limited experience with microservices', 'Study service decomposition, API gateway patterns, and inter-service communication.');

-- Insert sample feedback sessions
INSERT INTO feedback_sessions (raw_feedback, ai_comments, devils_advocate_enabled, suggested_questions) VALUES
('Had a mock interview today. Struggled with the binary tree problem - kept getting confused with the recursive calls. Also had trouble explaining the time complexity clearly. The behavioral question went okay but I think I rambled a bit.', 
'Focus on strengthening recursive thinking patterns and complexity analysis. Practice articulating solutions more concisely.', 
false,
'[{"question": "Implement binary tree level order traversal", "topic": "DSA", "difficulty": "Medium"}, {"question": "Explain the difference between BFS and DFS", "topic": "DSA", "difficulty": "Easy"}]'::jsonb),

('System design round was tough. Asked to design a chat application. I mentioned websockets but couldn''t explain how to handle millions of users. Interviewer asked about database design and I suggested MongoDB but couldn''t justify why over SQL.', 
'System design requires more depth in scalability concepts. Study load balancing, database selection criteria, and real-time communication patterns.', 
true,
'[{"question": "Design a real-time chat system", "topic": "System Design", "difficulty": "Hard"}, {"question": "How would you handle 1M concurrent websocket connections?", "topic": "System Design", "difficulty": "Hard"}]'::jsonb);

-- Insert sample pointer history
INSERT INTO pointer_history (pointer_id, change_type, ai_reasoning, similarity_score, remarks, previous_status, new_status)
SELECT 
    p.id,
    'created',
    'Initial pointer created from feedback analysis',
    0.9,
    'AI identified this as a key improvement area',
    null,
    'not_started'
FROM pointers p
WHERE p.title LIKE '%Binary Search Tree%';
