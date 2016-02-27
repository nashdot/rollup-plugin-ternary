if (!false) {
if (process.env.NODE_ENV !== 'production') {
invariant(false, 'Message')
} else {
invariant(false)
}
} else {};