export default function typeCast(field, next) {
  if (field.type === 'NEWDECIMAL') {
    return parseFloat(field.string());
  }

  return next();
}
