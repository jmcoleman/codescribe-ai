export default function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large',
      message: 'Maximum file size is 500KB'
    });
  }

  // Multer file filter errors (invalid file type)
  if (err.message === 'Invalid file type') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: 'Only .js, .jsx, .ts, .tsx, and .py files are allowed'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: err.message
    });
  }

  // Claude API errors
  if (err.type === 'api_error') {
    return res.status(500).json({
      error: 'AI service error',
      message: 'Failed to generate documentation. Please try again.'
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
}
