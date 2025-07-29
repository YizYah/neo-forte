import * as fs from 'fs';
import * as path from 'path';

export interface QuerySpecData {
  name: string;
  query: string;
  params: any;
  output: any;
}

export function writeQuerySpec(filePath: string, querySpecData: QuerySpecData): void {
  if (!process.env.QUERY_SPECS_FILE) {
    return; // Only write when the environment variable is set
  }

  try {
    const dir = path.dirname(filePath);
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Generate a unique name based on query content and timestamp
    const timestamp = Date.now();
    const uniqueName = `${querySpecData.name}_${timestamp}`;

    // Format the query spec entry
    const querySpecEntry = `  {
    name: '${uniqueName}',
    query: \`${querySpecData.query.replace(/`/g, '\\`')}\`,
    params: ${JSON.stringify(querySpecData.params, null, 6)},
    output: ${JSON.stringify(querySpecData.output, null, 6)}
  }`;

    // Check if file exists
    const fileExists = fs.existsSync(filePath);
    
    if (!fileExists) {
      // Create new file with imports and initial structure
      const content = `import { QuerySpec } from 'neo-forgery';

export const generatedQuerySpecs: QuerySpec[] = [
${querySpecEntry}
];
`;
      fs.writeFileSync(filePath, content);
    } else {
      // Read existing content
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Find the last entry and add a comma, then insert new entry before the closing bracket
      if (content.includes('];')) {
        // Replace the closing bracket with new entry and closing bracket
        content = content.replace(/\s*\];?\s*$/, `,
${querySpecEntry}
];
`);
      } else {
        // File exists but malformed, recreate it
        const newContent = `import { QuerySpec } from 'neo-forgery';

export const generatedQuerySpecs: QuerySpec[] = [
${querySpecEntry}
];
`;
        fs.writeFileSync(filePath, newContent);
        return;
      }
      
      fs.writeFileSync(filePath, content);
    }
  } catch (error) {
    // Silently fail to avoid breaking query execution
    // In production, you may want to use a proper logger instead
  }
}