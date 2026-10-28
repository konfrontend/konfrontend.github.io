---
question: How would you keep access secure?
---
The server reads the database through a read-only role, and each third-party integration sees only what is shared with it. Each team member gets their own token, stored only as a hash and revocable on its own. Tool errors pass through a sanitizer that strips database detail before the assistant sees them, and every write lives in its own tool.
