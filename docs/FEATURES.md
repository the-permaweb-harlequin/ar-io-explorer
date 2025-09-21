# Desired features from the ar-io-explorer

Datasets are ideally pulled from parquet, indices created by daemongate.io and atticus.black

# AO

- Users search (address in arweave and ethereum)
    - uses GQL to resolve the public key and check if its AR or Eth
- messages search (id)
- process search (id)
- modules (id)
- results
- cranking

## Users

Should be able to:
- Search for a user by address (arweave and ethereum)
- View their transaction history
    - Messages
    - Spawns
    - Assignments
    - Modules
    - Tokens
- Wallet relationships (transfers in/out)
- Net worth


## Messages

Should be able to:
- Search for message by ID
- View the cranking change and relationships along the path, and route to them
- View message results

## Processes

Should be able to:
- Search for a process by ID
- View the incoming, outgoing, and scheduled messages
- View the Spawned processes
- View the Assignments
- View the module (and route to the module view)
- Send reads to the process
- Send writes to the process
- If AOS, open a console view for the process
    - Dry run toggle + as-owner toggle
    - Show the source code of the process (lua)
        - Can achieve this by reading the embedded lua program, then querying for all Eval's (successful evals) and diffing them.
    - Show the memory usage of the process
    - Nonce (the reference)
    - Pending coroutines (if wasm aos, not hyper-aos)
    - Handlers
        - If available, should actually be able to parse the related handlers from the code and have them readable there
        - Render a form to interact with the handler (and save the history)

## Modules

Should be able to:
- Download the module
- View the module (wasm state and details)
- Spawn a process from the module
- View processes spawned from the module
- View module relationships (crossing From-Module tags on cranking paths on child processes)


# ARNS

Specific search for ArNS related things

- ArNS names
    - Undernames
- Primary names
- Users
- ANTs
- ANT Registry
    - ANT Versions

## ArNS Names

Should be able to:
- Search for an ArNS name
- Search for undernames
- View primary name list (user index)

## Users

- Browse users
- View their assets
- User Dashboard
    - Domains
    - ANTs
    - primary name
    - AR.IO token balance
    - Delegations
    - Gateway operator info

## ANTs

- Browse ANTs
    - Via ANT Registry index
    - Via spawned processes from registered modules in the Versions index
- Version spread chart on registered ArNS names (ecosystem health)
- ANT interaction view
    - ... process view
    - Call handlers/interact w/ custom tags and data
    - Easy state and info calls
    - Fork button
    - Upgrade button (wraps fork workflow)
    - GQL process meta
    - Associated ArNS names
    - Records management
    - Controllers management
    - Register to ANT registry button

## ANT Registry

- User count
- ANT count
- ACL queries
- Register form
- Versions view
    - With management API's for ar.io employees to add versions via VAOT


# ARIO

- Gateways
- Operators
- Extensions (sidecars)
