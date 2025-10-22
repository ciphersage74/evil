# evil
generator website

## Project Bundle

The complete salon project lives in the `salon-coiffure/` directory. If you need an archive you can generate it locally with:

```bash
zip -r salon-coiffure.zip salon-coiffure
```

Binary archives are ignored by git to keep pull requests text-only.

## Frontend Generator

Run `./setup-frontend.sh` to scaffold the React frontend in `salon-frontend/`. The script creates the Vite + Tailwind project, sample pages, and the accompanying `INSTALL-FRONTEND.sh` helper for building or deploying the UI.

Once generated you can follow the `salon-frontend/README.md` instructions to install dependencies, start the dev server, or copy the production build to your PHP backend.
