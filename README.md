
Easy S3 uploader for Github Actions.

You can upload files or directories to any S3 compatible cloud buckets.

## Usage

See the following example.

```YAML
# inside .github/workflows/action.yml
name: Add File to Bucket
on: push

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@master

      - name: Upload file to bucket
        uses: axazara/easy-s3-upload-github-action@main
        env:
          SOURCE: ./releases/
          S3_ENDPOINT: 'xxxx.r2.cloudflarestorage.com/xxxx'
          S3_BUCKET: ${{ secrets.S3_BUCKET }}
          S3_ACCESS_KEY_ID: ${{ secrets.S3_ACCESS_KEY_ID }}
          S3_SECRET_ACCESS_KEY: ${{ secrets.S3_SECRET_ACCESS_KEY }}
          S3_ACL: 'public-read'
          S3_PREFIX: 'releases/'
          VERBOSE: yes
```

## Configuration

All options are passed as environment variables.

| Variable | Required | Description |
|---|---|---|
| `SOURCE` | yes | Path to the file or directory to upload. Directories are uploaded recursively. |
| `S3_BUCKET` | yes | Target bucket name. |
| `S3_ACCESS_KEY_ID` | yes | Access key id. |
| `S3_SECRET_ACCESS_KEY` | yes | Secret access key. |
| `S3_ENDPOINT` | no | Custom endpoint for non-AWS providers (e.g. Cloudflare R2). |
| `S3_REGION` | no | Bucket region. Defaults to `us-east-1`. |
| `S3_PREFIX` | no | Key prefix prepended to every uploaded object. |
| `S3_ACL` | no | Object ACL (e.g. `public-read`). Omit for providers that do not support ACLs. |
| `VERBOSE` | no | Set to `true`/`yes`/`1` to log each upload. Quiet by default. |

> **Note:** `FILE` is still accepted as a deprecated alias for `SOURCE`. Prefer `SOURCE` going forward.
