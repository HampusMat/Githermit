## /repos
**Method:** GET

**Description:**<br>
Retrieves a list of available repositories.

**Parameters:**<br>
None

**Response:**<br>

| Code    | Description            | Schema                                                              |
|---------|------------------------|---------------------------------------------------------------------|
| 200     | A list of repositories | [\[Repository summary\]](/docs/interfaces/api.RepositorySummary.html) |
| 400-599 | An error               | [Error](/docs/modules/api.html#Error)                               |

<br>

## /repos/:repo
**Method:** GET

**Description:**<br>
Retrieves a repository.

**Parameters:**<br>

| Name | Location | Description    | Required | Schema |
|------|----------|----------------|----------|--------|
| repo | path     | The repository | true     | string |

**Response:**<br>

| Code    | Description  | Schema                                             |
|---------|--------------|----------------------------------------------------|
| 200     | A repository | [Repository](/docs/interfaces/api.Repository.html) |
| 400-599 | An error     | [Error](/docs/modules/api.html#Error)              |

<br>

## /repos/:repo/tree
**Method:** GET

**Description:**<br>
Retrieves a repository tree.

**Parameters:**<br>

| Name | Location | Description      | Required | Schema |
|------|----------|------------------|----------|--------|
| repo | path     | The repository   | true     | string |
| path | query    | Path in the tree | false    | string |

**Response:**<br>

| Code    | Description | Schema                                |
|---------|-------------|---------------------------------------|
| 200     | A tree      | [Tree](/docs/modules/api.html#Tree)   |
| 400-599 | An error    | [Error](/docs/modules/api.html#Error) |

<br>

## /repos/:repo/tags
**Method:** GET

**Description:**<br>
Retrieves a repository tag.

**Parameters:**<br>

| Name | Location | Description    | Required | Schema |
|------|----------|----------------|----------|--------|
| repo | path     | The repository | true     | string |

**Response:**<br>

| Code    | Description | Schema                                |
|---------|-------------|---------------------------------------|
| 200     | A tag       | [\[Tag\]](/docs/modules/api.html#Tag) |
| 400-599 | An error    | [Error](/docs/modules/api.html#Error) |

<br>

## /repos/:repo/log
**Method:** GET

**Description:**<br>
Retrieves a repository's log.

**Parameters:**<br>

| Name   | Location | Description    | Required | Schema |
|--------|----------|----------------|----------|--------|
| repo   | path     | The repository | true     | string |
| branch | query    | A branch       | false    | string |

**Response:**<br>

| Code    | Description  | Schema                                             |
|---------|--------------|----------------------------------------------------|
| 200     | A log commit | [\[Log commit\]](/docs/modules/api.html#LogCommit) |
| 400-599 | An error     | [Error](/docs/modules/api.html#Error)              |

<br>

## /repos/:repo/log/:commit
**Method:** GET

**Description:**<br>
Retrieves a commit from a repository.

**Parameters:**<br>

| Name   | Location | Description    | Required | Schema |
|--------|----------|----------------|----------|--------|
| repo   | path     | The repository | true     | string |
| commit | path     | A commit SHA   | true     | string |

**Response:**<br>

| Code    | Description | Schema                                     |
|---------|-------------|--------------------------------------------|
| 200     | A commit    | [Commit](/docs/interfaces/api.Commit.html) |
| 400-599 | An error    | [Error](/docs/modules/api.html#Error)      |

<br>

## /repos/:repo/branches
**Method:** GET

**Description:**<br>
Retrieves a repository's branches.

**Parameters:**<br>

| Name   | Location | Description    | Required | Schema |
|--------|----------|----------------|----------|--------|
| repo   | path     | The repository | true     | string |

**Response:**<br>

| Code    | Description | Schema                                                        |
|---------|-------------|---------------------------------------------------------------|
| 200     | A branch    | [\[Branch summary\]](/docs/interfaces/api.BranchSummary.html) |
| 400-599 | An error    | [Error](/docs/modules/api.html#Error)                         |

<br>

## /repos/:repo/branches/:branch
**Method:** GET

**Description:**<br>
Retrieves a branch from a repository.

**Parameters:**<br>

| Name   | Location | Description    | Required | Schema |
|--------|----------|----------------|----------|--------|
| repo   | path     | The repository | true     | string |
| branch | path     | A branch       | true     | string |

**Response:**<br>

| Code    | Description | Schema                                     |
|---------|-------------|--------------------------------------------|
| 200     | A branch    | [Branch](/docs/interfaces/api.Branch.html) |
| 400-599 | An error    | [Error](/docs/modules/api.html#Error)      |