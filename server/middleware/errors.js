export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(error.errors).map((item) => item.message).join(". ") });
  }
  if (error.name === "CastError") return res.status(400).json({ message: "The requested record ID is invalid." });
  if (error.code === 11000) return res.status(409).json({ message: "A record with that value already exists." });
  console.error(error);
  return res.status(error.status || 500).json({ message: error.status ? error.message : "An unexpected server error occurred." });
}
