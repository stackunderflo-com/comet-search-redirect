# Chrome Web Store Assets (Reference only)

This folder contains the materials for Chrome Web Store publication.

**IMPORTANT:** These files are NOT automatically used by Google. They must be uploaded **MANUALLY** in the developer console.

## Folder Structure

```
store-assets/
├── description.txt              # Full description (copy-paste)
├── store-listing.json           # Metadata and configuration
├── screenshots/                 # PNG screenshots (1280x800px)
│   ├── 01.png
│   ├── 02.png
│   └── 03.png
└── README.md                    # This file
```

## Correct Publication Process

### 1. Create the Extension Package
```bash
npm run package
# Creates package.zip with ONLY the extension
```

### 2. Manual Upload to Chrome Web Store

1. **Go to** [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/)

2. **Upload package.zip** (contains only the extension)

3. **"Store Listing" tab**:
   - **Description:** Copy from `description.txt`
   - **Screenshots:** Upload from `screenshots/` (1 to 5 images)
   - **Category:** Productivity
   - **Language:** English

## What Each File Does

- **`description.txt`** - Full text to copy-paste into Chrome Web Store
- **`store-listing.json`** - Metadata, keywords, and configuration
- **`screenshots/`** - Your 1280x800px PNG screenshots (max 5)

## What does NOT work

- Google does not read screenshots from package.zip
- Google does not read the long description from package.zip
- Store assets are NOT automatically imported

## What works

- Manual upload of package.zip (extension only)
- Copy-paste description from description.txt
- Manual upload of screenshots from screenshots/
- Chrome Web Store only reads manifest.json from package.zip

## Updates

To update the extension:
1. Modify the code and increment the version in `../public/manifest.json`
2. `npm run package` to create a new package.zip
3. Upload the new package.zip
4. If needed, update description/screenshots manually
