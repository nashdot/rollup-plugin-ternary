if (!false) {
if (process.env.NODE_ENV !== 'production') {
invariant(false, 'Message: failed?!')
} else {
invariant(false)
}
} else {};