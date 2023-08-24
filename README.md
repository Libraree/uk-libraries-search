# @libraree/uk-libraries-search

This package will allow you to:

1. search for books in any UK public library's catalogue and check availability at local branches; and
2. list other library-related reference data, such as the online catalogue's home page.

It is used to perform the back-end searches for [Libraree](https://libraree.org).

> **This package will not work in Javascript front-ends because of CORS restrictions.** The package's primary use-case is within a Node back-end or potentially within a browser extension (with URLs whitelisted in the extension manifest).

## Delivery Approach

This package operates on a screen-scraping basis. As such, breakages can sometimes occur. The main causes of these are:

1. A library service moves from one catalogue platform to another. This is the cause for breakages in the majority of cases;
2. The catalogue platform itself is updated. This happens very occasionally.

To try and resolve such breakages as quickly as possible, all library services are tested once per week and any issues are rectified. 

The successful operation of the package also depends on the availability of a library service's catalogue. If that goes down, this package won't be able to perform any searches and an exception will be thrown.

## Basic Usage

### Searching for a single book

```js
const client = new Client();
const result = await client.searchBook('Wigan', '9780747532743');
```

The first parameter is either the name or code of a library service, [as listed here](docs/listing.md). The second parameter is the ISBN of a book.

The `result` variable will look like this (when serialised):

```json
{
    "service": "Wigan",
    "code": "E08000010",
    "isbn": "9780747532743",
    "url": "https://wigan.spydus.co.uk/cgi-bin/spydus.exe/ENQ/WPAC/BIBENQ?NRECS=1&ISBN=9780747532743",
    "id": "6933017",
    "availability": [
        {
            "branch": "Ashton-in-Makerfield Library",
            "available": 1,
            "unavailable": 0
        },
        {
            "branch": "Golborne Library",
            "available": 0,
            "unavailable": 1
        },
        {
            "branch": "Leigh Library",
            "available": 0,
            "unavailable": 1
        },
        {
            "branch": "Platt Bridge Library",
            "available": 1,
            "unavailable": 0
        },
        {
            "branch": "The Grange Community Library",
            "available": 1,
            "unavailable": 0
        }
    ]
}
```

The `url` value is the direct link to the book's listing in the library service's catalogue. The `id` value is the unique identifier for that book in the library service's catalogue.

### Searching for multiple books

```js
const client = new Client();
const results = await client.searchBooks('Wigan', [
        '9780747532743',
        '9780141036144',
        '9780141439518',
        '9781904271338',
        '9780007371464'
    ]);
```

The first parameter is either the name or code of a library service, [as listed here](docs/listing.md). The second parameter is an array of ISBNs. The ISBNs might be editions of the same book, or completely different books altogether.

The `results` variable will contain an array of objects (each structured as above in the single book example).

### Getting catalogue information about a specific library service

```js
  const client = new Client();
  const result = client.getService('Wigan');
```

The `result` variable will look like this (when serialised):

```json
{
    "name": "Wigan",
    "code": "E08000010",
    "type": "Spydus",
    "catalogueUrl": "https://wigan.spydus.co.uk/"
}
```

### Listing all library services

```js
  const client = new Client();
  const results = client.listServices();
```

The `results` variable will contain an array of objects (each structured as above in the specific library service example).

### Listing a library service's branches

```js
  const client = new Client();
  const result = await client.listLibraries('Wigan');
```

The `result` variable will look like this (when serialised):

```json
{
    "name": "Wigan",
    "code": "E08000010",
    "branches": [
        "Ashton-in-Makerfield Library",
        "Aspull Library",
        "Atherton Library",
        "E Resources",
        "General Fiction Reserve Stock",
        "Golborne Library",
        "Hindley Library",
        "Ince Library",
        "Lamberhead Green Library",
        "Leigh Library",
        "Leigh Local History",
        "Marsh Green Library",
        "Platt Bridge Library",
        "Reserve Stock",
        "Schools Library Service",
        "Shevington Library",
        "Standish Library",
        "The Grange Community Library",
        "Tyldesley Library",
        "Wigan Library",
        "Wigan Local Studies"
    ]
}
```

## Customising the HTTP requests

When instantiating a new `Client` instance, it's possible to pass in a custom HTTP agent implementation to deal with various scenarios such as proxies, custom headers, etc.

```js
const client = new Client(httpClient);
const result = await client.listLibraries('Wigan');
```

The `httpClient` parameter must be a class which implements the [`IHttpClient`](src/net/IHttpClient.ts) interface and returns [`HttpResponse`](src/net/HttpResponse.ts) objects.

If no `httpClient` is provided, a default [SuperAgent-based implementation](src/net/SuperAgentHttpClient.ts) is used.

## Tests

This project is primarily driven by integration tests, however unit tests also exist to catch accidental bugs as quickly as possible during development.

* Integration tests exercise every library service and genuinely communicate with their catalogues.
* Unit tests exercise a low number of services per catalogue type. The tests use "canned" HTTP responses and don't actually communicate with catalogues.

Integration tests are scheduled to run as a GitHub Action once per week on a Friday. Any issues arising are typically dealt with over the following weekend, but on a best-efforts basis.

Unit tests use [Proxyman](https://proxyman.io) log files to simulate HTTP traffic. These log files are based on earlier executions of the integration tests and are updated as and when required.

## Known Issues

| Service           | Type      | Problem                                                      | Identified |
| ----------------- | --------- | ------------------------------------------------------------ | ---------- |
| Bexley            | `arenaV7` | LFR_SESSION_STATE cookie - JS-generated.                     | 23/08/2023 |
| Various, evolving | `arenaV7` | Catalogues are undergoing reconfiguration and upgrades leading to the failure of searches. This problem is outside of this package's control. | 23/08/2023 |

## Acknowledgements

This library is an evolution of [LibrariesHacked/catalogues-library](https://github.com/LibrariesHacked/catalogues-library) by [Dave Bathnes](https://github.com/DaveBathnes) to which I was a contributor for some time. The main objective for creating this alternative package were:

* using Typescript as the basis for development;
* making unit testing of the package a possibility;
* making code coverage monitoring a possibility; and
* providing a search interface that was more consistent with [Libraree's](https://libraree.org) needs.

Generally speaking, the same functionality exists in this package with the exception of some of the optional "extras" of Catalogues-Library (e.g. LibraryThing search).

Much of the screen-scraping logic has been maintained, though logic branches that have been proven to be no longer required (via code coverage analysis during integration testing) have been pruned.