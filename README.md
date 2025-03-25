# bcd-utils

**Utilities for processing MDN's Browser Compatibility Data (BCD).**

This monorepo includes tools to process
[browser-compat-data](https://github.com/mdn/browser-compat-data) BCD for use in
MDN's frontend ([yari](https://github.com/mdn/yari)) and backend
([rumba](https://github.com/mdn/rumba)).

## Structure

This repository consists of two packages:

### `/api`

Generates JSON files from BCD to be consumed by MDN's
[yari](https://github.com/mdn/yari) frontend, powering the BCD tables.

- **Usage**:

  ```sh
  cd api
  npm ci
  npm update @mdn/browser-compat-data
  npm run generate
  ```

- **Output**:  
  Writes one JSON file per BCD feature to `/api/out/current/*.json` and
  `/api/out/<version>/*.json`.

### `/updates`

Generates JSON files from BCD to be consumed by MDN's
[rumba](https://github.com/mdn/rumba) backend, powering the
[Updates](https://developer.mozilla.org/en-US/plus/updates) feature.

- **Usage**:

  ```sh
  cd updates
  npm ci
  npm run updates
  ```

- **Output**:  
  Writes JSON files for BCD updates by browser release to
  `/updates/v0/bcd-updates-*.json`.

## Contributing

Please read the [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before contributing.

## License

This project is licensed under [MPL-2.0](./LICENSE).
