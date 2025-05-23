const fs = require('fs');
const path = require('path');

// Directories to scan
const directories = [
  './app/auth',
  './app/dashboard',
  './app/profile',
];

// Function to replace imports in a file
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it's a client component
    const isClientComponent = content.includes("'use client'");
    
    // Replace the imports
    let newContent = content
      .replace(
        "import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';", 
        "import { createBrowserClient } from '@supabase/ssr';"
      )
      .replace(
        "import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';",
        "import { createServerClient } from '@supabase/ssr';"
      );
    
    // Fix client component Supabase initialization
    if (isClientComponent) {
      // Add config import if not already present
      if (!newContent.includes("import { supabaseUrl, supabaseAnonKey }")) {
        // Find the last import statement
        const importRegex = /^import.*from.*$/gm;
        const imports = [...newContent.matchAll(importRegex)];
        
        if (imports.length > 0) {
          const lastImport = imports[imports.length - 1][0];
          const lastImportIndex = newContent.indexOf(lastImport) + lastImport.length;
          
          // Insert the config import after the last import
          newContent = 
            newContent.slice(0, lastImportIndex) + 
            "\nimport { supabaseUrl, supabaseAnonKey } from '../../config';" + 
            newContent.slice(lastImportIndex);
        }
      }
      
      // Replace the client initialization
      newContent = newContent
        .replace(
          /const supabase = createBrowserClient\(.*\);/g,
          "const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);"
        )
        .replace(
          /const supabase = createClientComponentClient\(\);/g,
          "const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);"
        );
    } else {
      // Server component replacements
      newContent = newContent
        .replace(
          /const supabase = createClientComponentClient\(\);/g,
          "const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);"
        )
        .replace(
          /const supabase = createClientComponentClient\(\{ cookies: cookies \}\);/g,
          "const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);"
        )
        .replace(
          /const supabase = createServerComponentClient\(\{ cookies \}\);/g,
          "const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies });"
        );
    }
    
    // Only write to the file if changes were made
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to scan directory recursively
function scanDirectory(directory) {
  const files = fs.readdirSync(directory);
  let count = 0;
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      count += scanDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (updateFile(filePath)) {
        count++;
      }
    }
  }
  
  return count;
}

// Main function
function main() {
  console.log('Starting to update Supabase imports...');
  let totalUpdated = 0;
  
  for (const directory of directories) {
    if (fs.existsSync(directory)) {
      const updated = scanDirectory(directory);
      totalUpdated += updated;
      console.log(`Updated ${updated} files in ${directory}`);
    } else {
      console.warn(`Directory not found: ${directory}`);
    }
  }
  
  console.log(`Completed! Total files updated: ${totalUpdated}`);
}

main(); 