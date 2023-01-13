airtable-typegen
=================

Generate TypeScript types & [Zod](https://github.com/colinhacks/zod) schemas from your Airtable bases.

[![Version](https://img.shields.io/npm/v/airtable-typegen.svg)](https://npmjs.org/package/airtable-typegen)
[![CI](https://img.shields.io/github/actions/workflow/status/jkcorrea/airtable-typegen/ci.yml)](https://github.com/jkcorrea/airtable-typegen/actions/workflows/ci.yml)
[![Downloads/week](https://img.shields.io/npm/dw/airtable-typegen.svg)](https://npmjs.org/package/airtable-typegen)
[![License](https://img.shields.io/npm/l/airtable-typegen.svg)](https://github.com/jkcorrea/airtable-typegen/blob/main/package.json)

> :warning: **This has not be thoroughly tested with Airtable bases in the wild.** Please use carefully and sanity check the generated code before using in production! Contributions & bug reports are appreciated :)


## Quickstart

```sh
$ npm install --save-dev airtable-typegen
# or
$ yarn add -D airtable-typegen
```

Then generate types via:

```sh
$ airtable-typegen <BASE_ID> -o ./types/airtable.d.ts
```

Or generate [Zod](https://github.com/colinhacks/zod) schemas with the `-z` flag!

```sh
$ airtable-typegen <BASE_ID> -z -o ./src/schemas/airtable.ts
```

## Setup

The script relies on the [Airtable Meta API](https://airtable.com/api/meta), which requires an Access Token. This is different than an Airtable API key. The simplest way to get one is by creating a personal access token:

1. Navigate to https://airtable.com/create/tokens
2. Click “Create token”
3. Enter a name (e.g. “airtable-typegen”)
4. Give it a scope of `schema.bases:read`
5. Give permission to your relevant bases/workspaces
6. Copy the created token & store it in your .env as `AIRTABLE_TYPEGEN_ACCESS_TOKEN`

## Usage

The command takes a list of Airtable base IDs (those of the form `appXYZ...`) and some flags. It will output a file in your current working directory depending on the flags you supply it:

```
USAGE
  $ airtable-typegen [BASEID] [-v] [-z] [-t <value>]

ARGUMENTS
  BASEID  The Airtable Base ID (looks like appABC123XYZ). Can specify multiple.

FLAGS
  -o, --output=<value>  The file (relative to CWD) to write generated code to (defaults to "base-name.ts")
  -t, --tables=<value>  A comma-separated list of tables (names or ids) to generate from (defaults to all tables)
  -v, --version         Show CLI version.
  -z, --zod             Generate Zod schemas instead of TypeScript definitions

DESCRIPTION
  Generate TypeScript types and/or Zod schemas from an Airtable Base.
  Will read your Airtable API key from the AIRTABLE_TYPEGEN_ACCESS_TOKEN environment variable.
  Reads environment from .env file if present in current working directory.

EXAMPLES
  $ airtable-typegen appABC123
  > Outputs TypeScript definitions to ./base-name.ts

  $ airtable-typegen appABC123 -t MyTable,tblUOInmv7kanMKjr
  > Outputs TypeScript definitions to ./base-name.ts for the specified tables

  $ airtable-typegen appABC123 -z -o ./src/schemas/airtable.ts
  > Outputs Zod schemas to ./src/schemas/airtable.ts
```


For example, you could do this in your `package.json`:

```json
{
  "scripts": {
    "generate:airtable": "airtable-typegen <BASE_ID> -z -o src/schemas/airtable.ts",
  }
}
```

then run it everytime you want to sync the types:

```sh
$ npm run generate:airtable
```

Alternatively, you could combine it into your `dev` and `build` commands (withs omething like [npm-run-all](https://github.com/mysticatea/npm-run-all), perhaps):

```json
{
  "scripts": {
    "build": "run-s generate:airtable 'remix build'",
    "dev": "run-s generate:airtable 'remix dev'",
    "generate:airtable": "airtable-typegen <BASE_ID> -z -o src/schemas/airtable.ts",
  }
}
```
