---
question: Describe a project where you inherited existing software. How did you decide what to retain, repair or rebuild?
---
Loadster was in production when I joined. The rule I applied for six years: keep what works and is covered by tests, repair what fails or blocks a feature, rebuild only what costs more to repair than to replace. The Dashboard moved from Vue 2 to Vue 3 in place, component by component, with the existing store modules kept working, and the database driver was swapped from the MySQL connector to the MariaDB client with the schema untouched.
