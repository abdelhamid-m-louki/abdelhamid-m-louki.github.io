<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
define('GEMINI_KEY', getenv('GEMINI_KEY') ?: '');
define('OPENAI_KEY', getenv('OPENAI_KEY') ?: '');
$b = json_decode(file_get_contents('php://input'), true);
if (isset($b['ping'])) { echo json_encode(['ok'=>true]); exit; }
$texte=$b['texte']??''; $fourn=$b['fournisseur']??'gemini'; $ps=$b['promptSystem']??'';
if(!trim($texte)){http_response_code(400);echo json_encode(['erreur'=>'Texte vide.']);exit;}
function callai($url,$payload,$headers){
  $ch=curl_init($url);
  curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>json_encode($payload),
    CURLOPT_HTTPHEADER=>$headers,CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>30]);
  $r=curl_exec($ch);curl_close($ch);return json_decode($r,true);
}
try {
  if($fourn==='gemini'){
    if(!GEMINI_KEY)throw new Exception('Clé Gemini manquante.');
    $d=callai('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='.GEMINI_KEY,
      ['contents'=>[['role'=>'user','parts'=>[['text'=>$ps."\n\n".$texte]]]]],['Content-Type: application/json']);
    $r=$d['candidates'][0]['content']['parts'][0]['text']??'';
  } elseif($fourn==='openai'){
    if(!OPENAI_KEY)throw new Exception('Clé OpenAI manquante.');
    $d=callai('https://api.openai.com/v1/chat/completions',
      ['model'=>'gpt-4o-mini','messages'=>[['role'=>'system','content'=>$ps],['role'=>'user','content'=>$texte]],'max_tokens'=>2000],
      ['Content-Type: application/json','Authorization: Bearer '.OPENAI_KEY]);
    $r=$d['choices'][0]['message']['content']??'';
  } else throw new Exception('Fournisseur inconnu.');
  if(empty($r))throw new Exception('Réponse vide.');
  echo json_encode(['resultat'=>$r]);
} catch(Exception $e){http_response_code(500);echo json_encode(['erreur'=>$e->getMessage()]);}
