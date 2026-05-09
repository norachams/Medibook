# Medibook




# Key technical/product decisions

- One of the first technical/product decisions was how to handle the different views for patients and physicians after login. To keep this clean, I decided to use role-based access, where each user has a role assigned to them in the database, either `patient` or `physician`. After login, the app checks the user’s role and shows the appropriate view.
Another question that came up was how the app would know whether a new user should be a patient or a physician. Since we do not want patients to be able to create physician accounts, public signups are assigned the `patient` role by default. Physician accounts are not created through the public signup flow. In a real system, they would be created or approved by an admin or clinic to prevent unauthorized access to the physician dashboard. For this demo, physician accounts are pre-created in the mock data.
