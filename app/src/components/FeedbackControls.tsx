import { useEffect, useState } from 'react';
import { ThumbsDown, ThumbsUp } from '@phosphor-icons/react';
import { useAuth } from '../auth/AuthProvider';
import { feedback } from '../lib/api';
import { Button } from './ui/button';
export function FeedbackControls({ trackId }: { trackId: string }) { const { user } = useAuth(); const [value,setValue]=useState<string|null>(null); const [busy,setBusy]=useState(false); useEffect(()=>{if(user)void feedback.get(trackId).then(r=>setValue(r.data?.feedbackType??null)).catch(()=>setValue(null));else setValue(null)},[user,trackId]); if(!user)return null; async function set(type:'LIKE'|'DISLIKE'){setBusy(true);try{if(value===type){await feedback.remove(trackId);setValue(null)}else{await feedback.set(trackId,type);setValue(type)}}finally{setBusy(false)}} return <span className="feedback-controls" aria-label="Song feedback"><Button variant="outline" disabled={busy} aria-pressed={value==='LIKE'} onClick={()=>void set('LIKE')}><ThumbsUp size={16}/></Button><Button variant="outline" disabled={busy} aria-pressed={value==='DISLIKE'} onClick={()=>void set('DISLIKE')}><ThumbsDown size={16}/></Button></span>; }
