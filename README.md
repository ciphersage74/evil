# evil
generator website

## Project Bundle

Run the helper script to package the complete project (backend, frontend and setup scripts) into a zip archive:

```bash
./package-project.sh            # creates salon-complet.zip
./package-project.sh mon.zip    # custom archive name
```

The script only bundles files that exist locally and prints the path of the generated archive. Binary archives remain ignored by git to keep pull requests text-only.

## Frontend Generator

Run `./setup-frontend.sh` to scaffold the React frontend in `salon-frontend/`. The script creates the Vite + Tailwind project, sample pages, and the accompanying `INSTALL-FRONTEND.sh` helper for building or deploying the UI.

Once generated you can follow the `salon-frontend/README.md` instructions to install dependencies, start the dev server, or copy the production build to your PHP backend.
