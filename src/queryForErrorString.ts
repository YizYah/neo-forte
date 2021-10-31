export function truncatedParamString(params: any) {
  const paramsString = JSON.stringify(params);
  const MAX_LENGTH = 1500;
  if (paramsString && paramsString.length > MAX_LENGTH) return paramsString.substring(0, MAX_LENGTH) + '...';
  return paramsString
}

export function queryForErrorString(queryString: string,
    params: any) {
    return `
  
  query:
  -----------------
  ${queryString.trim()}
  -----------------   
  params: ${truncatedParamString(params)}
  
  `;
}
