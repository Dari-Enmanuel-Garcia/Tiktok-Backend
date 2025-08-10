//Esta mamada la hizo la ia ya que me dio miedito que si existiera esa vulnerabilidad, debo investigar mas al respecto
//mas adelante sobre si actualmente es una amenaza existente, esta funcion esta para ser facilmente eliminada
// en caso de que se requiera eso

const basicXssSanitize = (value) => {
  if (typeof value !== "string") return value;
  
  return value.replace(/<[^>]*>?/gm, "")
              .replace(/javascript:/gi, "")
              .replace(/on\w+="[^"]*"/gi, "")
              .replace(/on\w+="[^"]*"/gi, "")
              .replace(/on\w+=[^ >]+/gi, "");
};

const deepSanitize = (data) => {
  if (typeof data === "string") return basicXssSanitize(data);
  
  if (Array.isArray(data)) return data.map(deepSanitize);
  
  if (typeof data === "object" && data !== null) {
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = deepSanitize(data[key]);
    }
    return sanitized;
  }
  
  return data;
};

const sanitizeMiddleware = (req, res, next) => {
  try {
    if (req.body) req.body = deepSanitize(req.body);
    if (req.query) req.query = deepSanitize(req.query);
    if (req.params) req.params = deepSanitize(req.params);
    
    next();
  } catch (error) {
    console.error("Sanitization error", error);
    res.status(400).json({ message: "data invalida" });
  }
};

module.exports = sanitizeMiddleware;