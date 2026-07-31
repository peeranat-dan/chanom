// The in-memory test doubles moved to @chanom/internal (shared with
// create-chanom-app); re-export the slice cli tests use so their local import
// paths keep working.
export { makeTestFs, type TestFs } from '@chanom/internal/testing';
