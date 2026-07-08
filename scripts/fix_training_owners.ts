import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTrainingRequests() {
  console.log('Fetching training requests...');
  
  const { data: requests, error } = await supabase
    .from('solicitacoes')
    .select('id, requesteremail, metadata')
    .eq('type', 'employee_lifecycle');
    
  if (error) {
    console.error('Error fetching requests:', error);
    return;
  }
  
  const trainingRequests = requests.filter(r => 
    r.metadata?.form_data?.action === 'training' && 
    r.metadata?.form_data?.targetUserId
  );
  
  console.log(`Found ${trainingRequests.length} training requests. Fixing...`);
  
  for (const req of trainingRequests) {
    const targetUserId = req.metadata.form_data.targetUserId;
    
    const { data: targetUser } = await supabase
      .from('usuarios')
      .select('id, name, email')
      .eq('id', targetUserId)
      .single();
      
    if (targetUser && req.requesteremail !== targetUser.email) {
      console.log(`Updating request ${req.id} to be owned by ${targetUser.email}`);
      const { error: updateError } = await supabase
        .from('solicitacoes')
        .update({
          requesterid: targetUser.id,
          requestername: targetUser.name,
          requesteremail: targetUser.email
        })
        .eq('id', req.id);
        
      if (updateError) {
        console.error(`Failed to update ${req.id}:`, updateError);
      } else {
        console.log(`Successfully updated ${req.id}`);
      }
    } else {
      console.log(`Request ${req.id} já pertence ao usuário correto ou usuário não encontrado.`);
    }
  }
  
  console.log('Done!');
}

fixTrainingRequests();
