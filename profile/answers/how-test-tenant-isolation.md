---
question: How have you tested that one customer organisation cannot access another organisation's records?
---
At Loadster the API tests seed a user with permissions on one customer and assert that requests for another customer's resources are refused, and I reviewed every endpoint's permission check against the admin, team-admin and user roles.
