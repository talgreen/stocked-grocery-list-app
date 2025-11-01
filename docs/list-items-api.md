# Quick-add List Items API

The `/api/lists/[listId]/items` endpoint lets you add or reactivate items from shortcuts or voice assistants without opening the app.

## Authentication

No additional authentication headers are required when you call this endpoint. Provide the `listId` in the URL (use `default` for the main list). The Firebase security rules that back the hosted app still apply, so keep your deployment private if you expect to expose the endpoint on the public internet.

## Request body formats

Send `application/json` with one of the following payloads:

### Single item

```json
{
  "item": "Milk 3%",
  "comment": "2 bottles",
  "mode": "grocery"
}
```

### Multiple items

```json
{
  "items": [
    { "name": "Milk 3%", "comment": "2 bottles" },
    { "name": "Whole wheat bread" }
  ]
}
```

Optional fields per item:

- `comment`: text that appears under the item.
- `category` and `emoji`: override smart categorization.
- `mode`: set to `"pharmacy"` to force every incoming item into the 💊 בית מרקחת category.

## Response

Successful requests return a summary like:

```json
{
  "listId": "default",
  "mode": "grocery",
  "updated": true,
  "results": [
    {
      "name": "Milk 3%",
      "comment": "2 bottles",
      "status": "added",
      "category": { "name": "מוצרי חלב", "emoji": "🥛" }
    },
    {
      "name": "Whole wheat bread",
      "comment": "",
      "status": "unchecked",
      "category": { "name": "מאפים", "emoji": "🥖" }
    }
  ]
}
```

Possible `status` values:

- `added`: a new item was created with smart categorization.
- `unchecked`: an existing item was found and simply reactivated.
- `skipped`: the item was ignored (look at `reason` for details, e.g., failed categorization).

Errors are returned as `{ "error": "message" }` with HTTP status `400` for invalid payloads or `500` for unexpected failures.

## Example `curl`

```bash
curl -X POST "https://your-app.example.com/api/lists/default/items" \
  -H "Content-Type: application/json" \
  -d '{
        "items": [
          { "name": "Milk 3%", "comment": "2 bottles" },
          { "name": "Whole wheat bread" }
        ]
      }'
```

When you wire this into an iOS Shortcut, set the URL action to the endpoint above, the method to `POST`, the request body to JSON with the desired structure, and omit any auth headers.
