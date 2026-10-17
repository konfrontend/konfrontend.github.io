# Format rules

Rules for a rendered Version: `versions/general.md` and a tailored Version at `data/candidates/<folder>/version.md`, beside the employment Candidate's `job.md` and `cover-letter.md`. The Master is not bound. Layout (fonts, sizes, margins, spacing, single column) is fixed by `build/cv.css`; the Markdown shape the renderer parses is described in the `cv-pdf` skill. Adopted from upstream `resume-formatter`, which is not installed.

- Sections, in order: summary, Professional Experience, Projects. The summary is the paragraph after the contact line and carries no header. A Skills section, when a version adds one, sits between the summary and Professional Experience. Its terms are picked from the master: a term stays when a posting for the version's role would name it; the general version's role is full stack developer, the frontend version's senior frontend developer. No Education section. Header names come from the ATS-recognized set only.
- Contact line: location with UTC offset, email, GitHub, LinkedIn. No phone, no photo, no street address.
- Dates: one format throughout a version.
- Client and product: named only when the Project's Naming is `public`.
- Characters: no emoji; no symbols beyond `•`, `–` and `|`. Bold and italic sparingly.
- Sent PDF name: `Dolbilov_<Role>_<Company>_<MonYYYY>.pdf`, role as the posting's title in CamelCase, whichever Version it renders (general, frontend or tailored); it sits in the Candidate folder. The tailored source is always `version.md`. The public general version keeps `Konstantin_Dolbilov_Resume.pdf`.
