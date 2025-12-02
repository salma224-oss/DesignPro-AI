"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../../lib/supabase";
import Link from "next/link";
import type { ProjectMember, UserRole } from "../../../../../types";

export default function CollaborationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from('project_members')
      .select('*, user:profiles(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMembers(data as ProjectMember[]);
    }
    setLoading(false);
  };

  const sendInvitation = async () => {
    if (!inviteEmail.trim()) return;

    setSendingInvite(true);
    try {
      const { error } = await supabase
        .from('project_members')
        .insert([{
          project_id: projectId,
          user_email: inviteEmail.trim(),
          role: inviteRole,
          status: 'pending'
        }]);

      if (error) throw error;

      setInviteEmail('');
      loadMembers(); // Recharger la liste
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: UserRole) => {
    const { error } = await supabase
      .from('project_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (!error) {
      loadMembers();
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Retirer ce collaborateur ?')) return;

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId);

    if (!error) {
      loadMembers();
    }
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          ← Retour au projet
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des collaborateurs</h1>
        <p className="text-gray-600">Invitez et gérez les accès à votre projet</p>
      </div>

      {/* Invitation */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Inviter un collaborateur</h2>
        <div className="flex space-x-4">
          <input
            type="email"
            placeholder="Email du collaborateur"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as UserRole)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="viewer">Observateur</option>
            <option value="editor">Éditeur</option>
          </select>
          <button
            onClick={sendInvitation}
            disabled={sendingInvite || !inviteEmail.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {sendingInvite ? 'Envoi...' : 'Inviter'}
          </button>
        </div>
      </div>

      {/* Liste des membres */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Collaborateurs ({members.length})</h2>
        </div>
        
        <div className="divide-y">
          {members.map((member) => (
            <div key={member.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {member.user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {member.user?.email || member.user_email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {member.status === 'pending' ? 'Invitation en attente' : 'Membre actif'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <select
                  value={member.role}
                  onChange={(e) => updateMemberRole(member.id, e.target.value as UserRole)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="viewer">Observateur</option>
                  <option value="editor">Éditeur</option>
                </select>
                
                <button
                  onClick={() => removeMember(member.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
