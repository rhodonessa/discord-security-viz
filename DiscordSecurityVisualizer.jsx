import React, { useState, useMemo, useCallback, useRef, useEffect, createContext, useContext, memo } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import {
  Shield, AlertTriangle, Users, Hash, Lock, Eye, Upload, ChevronDown, ChevronRight,
  Search, Moon, Sun, Download, Copy, X, ArrowRight, Layers, FileText, AlertCircle,
  Info, ChevronUp, Zap, Target, GitCompare, Clock, Server, Bot, UserCheck, Key,
  BarChart3, Code, Check, ExternalLink, Settings, RefreshCw, Minus, Plus, ChevronLeft,
  Menu, Activity, Network, Trash2, FileJson, Columns, ArrowUpRight, Play, Square,
  TriangleAlert, ShieldAlert, ShieldCheck, Workflow, Globe, MessageSquare, Webhook,
  UserX, Crown, Sparkles, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// ----------------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------------

const DANGEROUS_PERMS = [
  'ADMINISTRATOR', 'MANAGE_GUILD', 'MANAGE_ROLES', 'MANAGE_CHANNELS',
  'MANAGE_WEBHOOKS', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MENTION_EVERYONE',
  'MANAGE_MESSAGES', 'VIEW_AUDIT_LOG', 'MANAGE_EVENTS', 'MODERATE_MEMBERS',
  'MANAGE_GUILD_EXPRESSIONS'
];

const PERM_CATEGORIES = {
  ADMINISTRATOR: { label: 'Administrator', tier: 'critical', desc: 'Full server control. Bypasses all permission checks.' },
  MANAGE_GUILD: { label: 'Manage Server', tier: 'critical', desc: 'Change server settings, name, icon, region.' },
  MANAGE_ROLES: { label: 'Manage Roles', tier: 'critical', desc: 'Create/edit/assign roles below their highest role position.' },
  MANAGE_CHANNELS: { label: 'Manage Channels', tier: 'high', desc: 'Create/edit/DELETE channels. Deletion is permanent.' },
  MANAGE_WEBHOOKS: { label: 'Manage Webhooks', tier: 'high', desc: 'Create webhooks that can impersonate any user/bot.' },
  BAN_MEMBERS: { label: 'Ban Members', tier: 'high', desc: 'Permanently ban members and purge their messages.' },
  KICK_MEMBERS: { label: 'Kick Members', tier: 'medium', desc: 'Remove members from the server.' },
  MENTION_EVERYONE: { label: 'Mention Everyone', tier: 'medium', desc: 'Ping all members. Spam/social engineering vector.' },
  MANAGE_MESSAGES: { label: 'Manage Messages', tier: 'medium', desc: 'Delete any message, pin messages.' },
  VIEW_AUDIT_LOG: { label: 'View Audit Log', tier: 'low', desc: 'See all moderation actions. Intelligence gathering.' },
  MANAGE_EVENTS: { label: 'Manage Events', tier: 'low', desc: 'Create/edit/delete scheduled events.' },
  MODERATE_MEMBERS: { label: 'Timeout Members', tier: 'medium', desc: 'Timeout members, preventing them from interacting.' },
  MANAGE_GUILD_EXPRESSIONS: { label: 'Manage Expressions', tier: 'low', desc: 'Add/remove emojis, stickers, soundboard sounds.' },
};

const SEVERITY_CONFIG = {
  CRITICAL: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', darkBg: '#450a0a', darkBorder: '#7f1d1d', icon: ShieldAlert, label: 'Critical' },
  HIGH: { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', darkBg: '#431407', darkBorder: '#7c2d12', icon: AlertTriangle, label: 'High' },
  MEDIUM: { color: '#ca8a04', bg: '#fefce8', border: '#fef08a', darkBg: '#422006', darkBorder: '#713f12', icon: AlertCircle, label: 'Medium' },
  LOW: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', darkBg: '#172554', darkBorder: '#1e3a5f', icon: Info, label: 'Low' },
  INFO: { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', darkBg: '#1f2937', darkBorder: '#374151', icon: Info, label: 'Info' },
};

const TIER_COLORS = {
  critical: { color: '#dc2626', bg: '#fef2f2' },
  high: { color: '#ea580c', bg: '#fff7ed' },
  medium: { color: '#ca8a04', bg: '#fefce8' },
  low: { color: '#2563eb', bg: '#eff6ff' },
  safe: { color: '#16a34a', bg: '#f0fdf4' },
};

const VIEWS = [
  { id: 'dashboard', label: 'Overview', icon: BarChart3 },
  { id: 'escalation', label: 'Escalation Paths', icon: Workflow },
  { id: 'hierarchy', label: 'Role Hierarchy', icon: Layers },
  { id: 'overwrites', label: 'Channel Overwrites', icon: Key },
  { id: 'findings', label: 'Findings', icon: ShieldAlert },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'network', label: 'Permission Network', icon: Network },
  { id: 'threatmap', label: 'Threat Map', icon: Target },
  { id: 'simulate', label: 'Simulate', icon: Zap },
  { id: 'threats', label: 'Threat Vectors', icon: ShieldAlert },
  { id: 'diff', label: 'Diff', icon: GitCompare },
  { id: 'report', label: 'Export Report', icon: FileText },
];

// ----------------------------------------------------------------------------
// THEME
// ----------------------------------------------------------------------------

const themes = {
  light: {
    bg: '#f8f9fb', bgAlt: '#ffffff', bgHover: '#f1f3f5',
    card: '#ffffff', cardBorder: '#e2e4e9', cardShadow: '0 1px 3px rgba(0,0,0,0.06)',
    text: '#1a1a2a', textSecondary: '#6b7280', textMuted: '#9ca3af',
    accent: '#6366f1', accentBg: '#eef2ff', accentBorder: '#c7d2fe',
    border: '#e2e4e9', borderStrong: '#d1d5db',
    danger: '#dc2626', dangerBg: '#fef2f2',
    success: '#16a34a', successBg: '#f0fdf4',
    warning: '#ca8a04', warningBg: '#fefce8',
    scrollbar: '#d1d5db', scrollbarHover: '#9ca3af',
    inputBg: '#f9fafb', inputBorder: '#d1d5db',
    codeBg: '#f3f4f6',
    graphNode: '#ffffff', graphNodeBorder: '#d1d5db',
    graphLink: '#94a3b8', graphLinkActive: '#6366f1',
  },
  dark: {
    bg: '#0a0a1a', bgAlt: '#12122a', bgHover: '#1a1a3a',
    card: '#1a1a2e', cardBorder: '#2a2a4a', cardShadow: '0 1px 3px rgba(0,0,0,0.3)',
    text: '#e0e0ff', textSecondary: '#9898c8', textMuted: '#6868a0',
    accent: '#818cf8', accentBg: '#1e1b4b', accentBorder: '#3730a3',
    border: '#2a2a4a', borderStrong: '#3a3a5a',
    danger: '#f87171', dangerBg: '#450a0a',
    success: '#4ade80', successBg: '#052e16',
    warning: '#fbbf24', warningBg: '#422006',
    scrollbar: '#3a3a5a', scrollbarHover: '#5a5a7a',
    inputBg: '#12122a', inputBorder: '#2a2a4a',
    codeBg: '#12122a',
    graphNode: '#1a1a2e', graphNodeBorder: '#3a3a5a',
    graphLink: '#4a4a6a', graphLinkActive: '#818cf8',
  }
};

const ThemeContext = createContext('light');
function useTheme() {
  const theme = useContext(ThemeContext);
  return { theme, colors: themes[theme], isDark: theme === 'dark' };
}

// ----------------------------------------------------------------------------
// ANALYSIS ENGINE
// ----------------------------------------------------------------------------

function analyzeEscalationPaths(roles) {
  const manageRolesHolders = roles.filter(r =>
    r.permissions_decoded?.MANAGE_ROLES && !r.has_admin && r.name !== '@everyone'
  );

  return manageRolesHolders.map(sourceRole => {
    const visited = new Set();
    const seen = new Set();
    const queue = [{ role: sourceRole, depth: 0 }];
    const assignable = [];
    const edges = [];
    const blocked = [];

    while (queue.length > 0) {
      const { role: current, depth } = queue.shift();
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      const targets = roles.filter(r =>
        r.position < current.position &&
        r.id !== current.id &&
        r.name !== '@everyone' &&
        !visited.has(r.id)
      );

      targets.forEach(target => {
        if (target.managed) {
          if (!seen.has(target.id)) {
            blocked.push({ from: current, to: target, reason: 'Managed role (bot-owned, cannot be reassigned)' });
            seen.add(target.id);
          }
        } else if (!seen.has(target.id)) {
          seen.add(target.id);
          assignable.push({ role: target, depth: depth + 1, via: current });
          edges.push({ from: current.id, to: target.id, depth });
          if (target.permissions_decoded?.MANAGE_ROLES) {
            queue.push({ role: target, depth: depth + 1 });
          }
        }
      });
    }

    const gainedPerms = new Set();
    assignable.forEach(({ role }) => {
      (role.dangerous_permissions || []).forEach(p => gainedPerms.add(p));
    });

    const maxDepth = assignable.length > 0 ? Math.max(...assignable.map(a => a.depth)) : 0;
    const hasChain = maxDepth > 1;
    const deadEnd = assignable.every(a =>
      !a.role.permissions_decoded?.MANAGE_ROLES || a.role.managed
    );

    return {
      source: sourceRole,
      assignable,
      blocked,
      edges,
      gainedPermissions: [...gainedPerms],
      maxDepth,
      hasChain,
      deadEnd,
      threatLevel: gainedPerms.has('ADMINISTRATOR') ? 'critical' :
        gainedPerms.has('MANAGE_GUILD') || gainedPerms.has('BAN_MEMBERS') ? 'high' :
        gainedPerms.size > 0 ? 'medium' : 'low'
    };
  });
}

function computeBlastRadius(member, roles, channels) {
  if (!member) return null;

  const memberRoleIds = new Set(member.roles.map(r => r.id));
  const memberRoles = roles.filter(r => memberRoleIds.has(r.id));
  const maxPos = Math.max(...memberRoles.map(r => r.position), 0);

  const directPerms = new Set();
  memberRoles.forEach(r => {
    Object.entries(r.permissions_decoded || {}).forEach(([perm, has]) => {
      if (has) directPerms.add(perm);
    });
  });

  const isAdmin = directPerms.has('ADMINISTRATOR');

  let assignableRoles = [];
  if (directPerms.has('MANAGE_ROLES') && !isAdmin) {
    assignableRoles = roles.filter(r =>
      !r.managed && r.position < maxPos && r.name !== '@everyone'
    );
  }

  const allPerms = new Set(directPerms);
  assignableRoles.forEach(r => {
    Object.entries(r.permissions_decoded || {}).forEach(([perm, has]) => {
      if (has) allPerms.add(perm);
    });
  });

  const userOverwrites = [];
  const deletableChannels = [];
  const webhookChannels = [];

  channels.forEach(ch => {
    ch.permission_overwrites?.forEach(ow => {
      if (ow.target_id === member.id && ow.target_type === 'member') {
        userOverwrites.push({ channel: ch, overwrite: ow });
        if ((ow.allow || []).includes('MANAGE_CHANNELS') || (ow.dangerous_allows || []).includes('MANAGE_CHANNELS')) {
          deletableChannels.push(ch);
        }
        if ((ow.allow || []).includes('MANAGE_WEBHOOKS') || (ow.dangerous_allows || []).includes('MANAGE_WEBHOOKS')) {
          webhookChannels.push(ch);
        }
      }
    });
  });

  if (allPerms.has('MANAGE_CHANNELS') || isAdmin) {
    channels.forEach(ch => {
      if (ch.type !== 'CATEGORY' && !deletableChannels.find(dc => dc.id === ch.id)) {
        deletableChannels.push(ch);
      }
    });
  }

  const dangerousPerms = [...allPerms].filter(p => DANGEROUS_PERMS.includes(p));
  let score = 0;
  if (isAdmin) score = 100;
  else {
    if (allPerms.has('MANAGE_GUILD')) score += 25;
    if (allPerms.has('BAN_MEMBERS')) score += 20;
    if (allPerms.has('MANAGE_ROLES')) score += 15;
    if (allPerms.has('MANAGE_CHANNELS')) score += 15;
    if (allPerms.has('MANAGE_WEBHOOKS')) score += 10;
    if (allPerms.has('KICK_MEMBERS')) score += 8;
    if (allPerms.has('MODERATE_MEMBERS')) score += 8;
    if (allPerms.has('MANAGE_MESSAGES')) score += 5;
    score += userOverwrites.length * 2;
    score += deletableChannels.length;
    score = Math.min(score, 99);
  }

  return {
    member,
    directPermissions: [...directPerms],
    allPermissions: [...allPerms],
    dangerousPermissions: dangerousPerms,
    assignableRoles,
    userOverwrites,
    deletableChannels,
    webhookChannels,
    isAdmin,
    blastScore: score,
    maxRolePosition: maxPos,
    threatLevel: score >= 80 ? 'critical' : score >= 50 ? 'high' : score >= 20 ? 'medium' : 'low',
  };
}

function computeSecurityScore(dump) {
  if (!dump) return { grade: '?', score: 0, breakdown: [] };

  const issues = dump.security_analysis?.issues || [];
  const roles = dump.roles || [];
  const channels = dump.channels || [];

  let deductions = 0;
  const breakdown = [];

  const critCount = issues.filter(i => i.severity === 'CRITICAL').length;
  const highCount = issues.filter(i => i.severity === 'HIGH').length;
  const medCount = issues.filter(i => i.severity === 'MEDIUM').length;

  if (critCount > 0) {
    const d = Math.min(critCount * 8, 30);
    deductions += d;
    breakdown.push({ label: `${critCount} critical findings`, impact: -d });
  }
  if (highCount > 0) {
    const d = Math.min(highCount * 2, 30);
    deductions += d;
    breakdown.push({ label: `${highCount} high findings`, impact: -d });
  }
  if (medCount > 0) {
    const d = Math.min(medCount * 1, 10);
    deductions += d;
    breakdown.push({ label: `${medCount} medium findings`, impact: -d });
  }

  const userOverwrites = channels.reduce((sum, ch) =>
    sum + (ch.permission_overwrites || []).filter(ow => ow.target_type === 'member' && (ow.dangerous_allows || []).length > 0).length, 0);
  if (userOverwrites > 10) {
    const d = Math.min(Math.floor(userOverwrites / 5) * 3, 15);
    deductions += d;
    breakdown.push({ label: `${userOverwrites} dangerous user overwrites`, impact: -d });
  }

  if (dump.guild?.mfa_level === 0) {
    deductions += 5;
    breakdown.push({ label: 'No 2FA requirement for moderation', impact: -5 });
  }

  const adminRoles = roles.filter(r => r.has_admin && r.name !== '@everyone');
  if (adminRoles.length > 3) {
    const d = (adminRoles.length - 3) * 3;
    deductions += d;
    breakdown.push({ label: `${adminRoles.length} admin roles (excessive)`, impact: -d });
  }

  const score = Math.max(0, 100 - deductions);
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  return { grade, score, breakdown };
}

function computeUserOverwriteAnalysis(channels) {
  const userMap = {};
  channels.forEach(ch => {
    (ch.permission_overwrites || []).forEach(ow => {
      if (ow.target_type === 'member') {
        if (!userMap[ow.target_id]) {
          userMap[ow.target_id] = { id: ow.target_id, name: ow.target_name, channels: [], dangerousCount: 0 };
        }
        const entry = { channel: ch, allow: ow.allow || [], deny: ow.deny || [], dangerous: ow.dangerous_allows || [] };
        userMap[ow.target_id].channels.push(entry);
        if (entry.dangerous.length > 0) userMap[ow.target_id].dangerousCount++;
      }
    });
  });
  return Object.values(userMap).sort((a, b) => b.dangerousCount - a.dangerousCount);
}

function generateRemediation(dump) {
  if (!dump) return [];
  const suggestions = [];
  const roles = dump.roles || [];
  const channels = dump.channels || [];

  const lowPosManageRoles = roles.filter(r =>
    r.permissions_decoded?.MANAGE_ROLES && !r.has_admin && !r.managed &&
    r.position < (Math.max(...roles.map(x => x.position)) * 0.3)
  );
  lowPosManageRoles.forEach(r => {
    suggestions.push({
      severity: 'HIGH',
      category: 'ESCALATION',
      action: `Review role "${r.name}" (pos ${r.position}). It has MANAGE_ROLES at a low position, creating escalation risk. Consider removing MANAGE_ROLES or raising its position.`,
    });
  });

  const userOverwrites = computeUserOverwriteAnalysis(channels);
  const dangerousUsers = userOverwrites.filter(u => u.dangerousCount > 3);
  dangerousUsers.forEach(u => {
    suggestions.push({
      severity: 'HIGH',
      category: 'OVERWRITES',
      action: `User ${u.id} has dangerous permissions on ${u.dangerousCount} channels via individual overwrites. Convert these to role-based permissions for auditability.`,
    });
  });

  if (dump.guild?.mfa_level === 0) {
    suggestions.push({
      severity: 'MEDIUM',
      category: 'SERVER',
      action: 'Enable 2FA requirement for moderation actions (Server Settings > Safety Setup).',
    });
  }

  if (dump.guild?.explicit_content_filter === 0) {
    suggestions.push({
      severity: 'MEDIUM',
      category: 'SERVER',
      action: 'Enable explicit content filter for all members.',
    });
  }

  return suggestions;
}

function diffDumps(dumpA, dumpB) {
  if (!dumpA || !dumpB) return null;

  const roleMapA = _.keyBy(dumpA.roles, 'id');
  const roleMapB = _.keyBy(dumpB.roles, 'id');
  const channelMapA = _.keyBy(dumpA.channels, 'id');
  const channelMapB = _.keyBy(dumpB.channels, 'id');
  const memberMapA = _.keyBy(dumpA.members, 'id');
  const memberMapB = _.keyBy(dumpB.members, 'id');

  const addedRoles = dumpB.roles.filter(r => !roleMapA[r.id]);
  const removedRoles = dumpA.roles.filter(r => !roleMapB[r.id]);
  const changedRoles = dumpB.roles.filter(r => {
    const old = roleMapA[r.id];
    if (!old) return false;
    return old.permissions_raw !== r.permissions_raw || old.position !== r.position || old.name !== r.name;
  }).map(r => ({ before: roleMapA[r.id], after: r }));

  const addedChannels = dumpB.channels.filter(c => !channelMapA[c.id]);
  const removedChannels = dumpA.channels.filter(c => !channelMapB[c.id]);

  const addedMembers = dumpB.members.filter(m => !memberMapA[m.id]);
  const removedMembers = dumpA.members.filter(m => !memberMapB[m.id]);

  const issueSetA = new Set(dumpA.security_analysis?.issues?.map(i => i.finding) || []);
  const issueSetB = new Set(dumpB.security_analysis?.issues?.map(i => i.finding) || []);
  const newIssues = (dumpB.security_analysis?.issues || []).filter(i => !issueSetA.has(i.finding));
  const resolvedIssues = (dumpA.security_analysis?.issues || []).filter(i => !issueSetB.has(i.finding));

  return {
    roles: { added: addedRoles, removed: removedRoles, changed: changedRoles },
    channels: { added: addedChannels, removed: removedChannels },
    members: { added: addedMembers, removed: removedMembers },
    issues: { new: newIssues, resolved: resolvedIssues },
    summary: {
      totalChanges: addedRoles.length + removedRoles.length + changedRoles.length +
        addedChannels.length + removedChannels.length + addedMembers.length + removedMembers.length,
    }
  };
}
// ----------------------------------------------------------------------------
// ANALYSIS: STALE OVERWRITE DETECTION
// ----------------------------------------------------------------------------

function detectStaleOverwrites(channels, members) {
  const memberIds = new Set((members || []).map(m => m.id));
  const stale = [];
  (channels || []).forEach(ch => {
    (ch.permission_overwrites || []).forEach(ow => {
      if (ow.target_type === 'member' && !memberIds.has(ow.target_id)) {
        stale.push({ channel: ch, overwrite: ow, userId: ow.target_id, dangerous: (ow.dangerous_allows || []).length > 0 });
      }
    });
  });
  return stale;
}

// ----------------------------------------------------------------------------
// ANALYSIS: PERMISSION CALCULATOR (Discord's exact algorithm)
// ----------------------------------------------------------------------------

function computeEffectivePermissions(member, channel, roles, guildOwnerId) {
  if (!member || !channel) return null;
  const steps = [];
  const memberRoleIds = new Set(member.roles.map(r => r.id));
  const allRoles = roles || [];
  const everyoneRole = allRoles.find(r => r.name === '@everyone');
  const memberRoles = allRoles.filter(r => memberRoleIds.has(r.id));

  // Step 0: Owner check
  if (member.id === guildOwnerId) {
    steps.push({ label: 'Server Owner', perms: new Set(DANGEROUS_PERMS), note: 'Server owner bypasses all permission checks', type: 'grant-all' });
    return { steps, final: new Set(DANGEROUS_PERMS), isOwner: true };
  }

  // Step 1: @everyone base
  const basePerms = new Set();
  if (everyoneRole?.permissions_decoded) {
    Object.entries(everyoneRole.permissions_decoded).forEach(([p, v]) => { if (v) basePerms.add(p); });
  }
  steps.push({ label: '@everyone base permissions', perms: new Set(basePerms), note: `${basePerms.size} permissions from server defaults`, type: 'base' });

  // Step 2: OR all member role permissions
  const rolePerms = new Set(basePerms);
  memberRoles.forEach(r => {
    Object.entries(r.permissions_decoded || {}).forEach(([p, v]) => { if (v) rolePerms.add(p); });
  });
  const roleAdded = [...rolePerms].filter(p => !basePerms.has(p));
  steps.push({ label: `Role permissions (${memberRoles.length} roles)`, perms: new Set(rolePerms), added: roleAdded, note: `+${roleAdded.length} from roles: ${memberRoles.map(r => r.name).join(', ')}`, type: 'roles' });

  // Admin shortcut
  if (rolePerms.has('ADMINISTRATOR')) {
    steps.push({ label: 'ADMINISTRATOR bypass', perms: new Set(DANGEROUS_PERMS), note: 'ADMINISTRATOR grants all permissions, overrides all channel denies', type: 'admin' });
    return { steps, final: rolePerms, isAdmin: true };
  }

  // Channel overwrites
  const overwrites = channel.permission_overwrites || [];
  const evOw = overwrites.find(ow => ow.target_id === everyoneRole?.id && ow.target_type === 'role');
  let channelPerms = new Set(rolePerms);

  // Step 3: Channel @everyone deny/allow
  if (evOw) {
    (evOw.deny || []).forEach(p => channelPerms.delete(p));
    (evOw.allow || []).forEach(p => channelPerms.add(p));
    steps.push({ label: 'Channel @everyone overwrite', perms: new Set(channelPerms), denied: evOw.deny || [], allowed: evOw.allow || [], note: `Deny: ${(evOw.deny||[]).join(', ') || 'none'} | Allow: ${(evOw.allow||[]).join(', ') || 'none'}`, type: 'channel-everyone' });
  }

  // Step 4-5: Channel role denies then allows (OR'd)
  const roleOws = overwrites.filter(ow => ow.target_type === 'role' && memberRoleIds.has(ow.target_id) && ow.target_id !== everyoneRole?.id);
  if (roleOws.length > 0) {
    const allDenies = new Set();
    const allAllows = new Set();
    roleOws.forEach(ow => { (ow.deny || []).forEach(p => allDenies.add(p)); (ow.allow || []).forEach(p => allAllows.add(p)); });
    allDenies.forEach(p => channelPerms.delete(p));
    allAllows.forEach(p => channelPerms.add(p));
    steps.push({ label: `Channel role overwrites (${roleOws.length} roles)`, perms: new Set(channelPerms), denied: [...allDenies], allowed: [...allAllows], note: `Role denies: ${[...allDenies].join(', ') || 'none'} | Role allows win: ${[...allAllows].join(', ') || 'none'}`, type: 'channel-roles' });
  }

  // Step 6-7: Member-specific deny then allow
  const memberOw = overwrites.find(ow => ow.target_type === 'member' && ow.target_id === member.id);
  if (memberOw) {
    (memberOw.deny || []).forEach(p => channelPerms.delete(p));
    (memberOw.allow || []).forEach(p => channelPerms.add(p));
    steps.push({ label: 'Member-specific overwrite (highest priority)', perms: new Set(channelPerms), denied: memberOw.deny || [], allowed: memberOw.allow || [], note: `Personal deny: ${(memberOw.deny||[]).join(', ') || 'none'} | Personal allow: ${(memberOw.allow||[]).join(', ') || 'none'}`, type: 'member-specific' });
  }

  return { steps, final: channelPerms, isAdmin: false, isOwner: false };
}

// ----------------------------------------------------------------------------
// PERMISSION CALCULATOR UI
// ----------------------------------------------------------------------------

function PermissionCalculator({ member, dump }) {
  const { colors, isDark } = useTheme();
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const channels = (dump.channels || []).filter(c => c.type !== 'CATEGORY');
  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  const result = useMemo(() => {
    if (!member || !selectedChannel) return null;
    return computeEffectivePermissions(member, selectedChannel, dump.roles || [], dump.guild?.owner_id);
  }, [member, selectedChannel, dump]);

  return (
    <Card style={{ padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
        Permission Calculator
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={selectedChannelId} onChange={e => setSelectedChannelId(e.target.value)} style={{
          flex: 1, padding: '6px 10px', borderRadius: 5, fontSize: 12,
          border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text,
        }}>
          <option value="">Select a channel...</option>
          {channels.map(c => <option key={c.id} value={c.id}>#{c.name} ({c.type})</option>)}
        </select>
      </div>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {result.steps.map((step, i) => (
            <div key={i} style={{
              padding: '8px 12px', borderRadius: 6, fontSize: 12,
              backgroundColor: step.type === 'admin' || step.type === 'grant-all' ? (isDark ? '#450a0a20' : '#fef2f2') :
                step.type === 'member-specific' ? (isDark ? '#1e1b4b20' : '#eef2ff') : colors.bgAlt,
              borderLeft: `3px solid ${step.type === 'admin' || step.type === 'grant-all' ? '#dc2626' :
                step.type === 'member-specific' ? '#6366f1' :
                step.type === 'channel-everyone' || step.type === 'channel-roles' ? '#ca8a04' : '#16a34a'}`,
            }}>
              <div style={{ fontWeight: 600, color: colors.text, marginBottom: 2 }}>
                Step {i + 1}: {step.label}
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>{step.note}</div>
              {step.allowed && step.allowed.length > 0 && (
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
                  {step.allowed.map(p => <span key={p} style={{ fontSize: 9, padding: '1px 4px', borderRadius: 2, backgroundColor: '#16a34a20', color: '#16a34a', fontFamily: "'JetBrains Mono', monospace" }}>+{p}</span>)}
                </div>
              )}
              {step.denied && step.denied.length > 0 && (
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
                  {step.denied.map(p => <span key={p} style={{ fontSize: 9, padding: '1px 4px', borderRadius: 2, backgroundColor: '#dc262620', color: '#dc2626', fontFamily: "'JetBrains Mono', monospace" }}>-{p}</span>)}
                </div>
              )}
            </div>
          ))}
          <div style={{ padding: '10px 12px', borderRadius: 6, backgroundColor: isDark ? '#052e1620' : '#f0fdf4', border: `1px solid ${isDark ? '#166534' : '#86efac'}`, marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#86efac' : '#166534', marginBottom: 4 }}>
              Final effective permissions ({result.final.size})
            </div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {[...result.final].filter(p => DANGEROUS_PERMS.includes(p)).map(p => <PermBadge key={p} perm={p} />)}
            </div>
          </div>
        </div>
      )}
      {!selectedChannel && <div style={{ fontSize: 12, color: colors.textMuted, padding: 12 }}>Select a channel to see how permissions resolve step-by-step.</div>}
    </Card>
  );
}
// ----------------------------------------------------------------------------
// SHARED COMPONENTS
// ----------------------------------------------------------------------------

function memberName(m) {
  if (!m) return '?';
  if (m.display_name && m.display_name !== 'unknown') return m.display_name;
  if (m.username && m.username !== 'unknown') return m.username;
  return '#' + m.id.slice(-6);
}

function SeverityBadge({ severity, count }) {
  const { colors } = useTheme();
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.INFO;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace",
      color: config.color, backgroundColor: config.bg, border: `1px solid ${config.border}`,
    }}>
      {config.label}{count != null && ` (${count})`}
    </span>
  );
}

function PermBadge({ perm }) {
  const cat = PERM_CATEGORIES[perm];
  const tier = cat?.tier || 'safe';
  const tc = TIER_COLORS[tier] || TIER_COLORS.safe;
  return (
    <span title={cat?.desc || perm} style={{
      display: 'inline-flex', padding: '1px 6px', borderRadius: 3, fontSize: 10,
      fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
      color: tc.color, backgroundColor: tc.bg, cursor: 'help', whiteSpace: 'nowrap',
    }}>
      {perm}
    </span>
  );
}

function Card({ children, style, className = '', onClick, hover }) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      className={className}
      style={{
        backgroundColor: colors.card, border: `1px solid ${hovered ? colors.accent : colors.cardBorder}`,
        borderRadius: 8, boxShadow: colors.cardShadow,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        ...(onClick && { cursor: 'pointer' }),
        ...(hovered && { boxShadow: `0 0 0 1px ${colors.accent}` }),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder = 'Search...', style }) {
  const { colors } = useTheme();
  const [local, setLocal] = useState(value);
  const debouncedChange = useMemo(() => _.debounce(onChange, 250), [onChange]);
  useEffect(() => { setLocal(value); }, [value]);
  return (
    <div style={{ position: 'relative', ...style }}>
      <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
      <input
        value={local} onChange={e => { setLocal(e.target.value); debouncedChange(e.target.value); }} placeholder={placeholder}
        style={{
          width: '100%', padding: '7px 10px 7px 32px', borderRadius: 6,
          border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.inputBg,
          color: colors.text, fontSize: 13, fontFamily: "'Space Grotesk', sans-serif",
          outline: 'none',
        }}
      />
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }) {
  const { colors } = useTheme();
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: color || colors.text, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>{sub}</div>}
        </div>
        {Icon && <Icon size={20} style={{ color: color || colors.textMuted, opacity: 0.6 }} />}
      </div>
    </Card>
  );
}

function RolePill({ role, onClick, small }) {
  const { colors } = useTheme();
  const roleColor = role.colorString || colors.textSecondary;
  const isDangerous = role.is_dangerous;
  const isManaged = role.managed;
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: small ? '1px 6px' : '2px 8px',
        borderRadius: 4, fontSize: small ? 10 : 12,
        fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
        color: roleColor, backgroundColor: `${roleColor}15`,
        border: `1px solid ${roleColor}30`,
        cursor: onClick ? 'pointer' : 'default',
        ...(isManaged && { borderStyle: 'dashed' }),
        ...(isDangerous && { boxShadow: `0 0 0 1px ${roleColor}40` }),
      }}
      title={`Position: ${role.position}${isManaged ? ' (managed/bot role)' : ''}${isDangerous ? ` | ${(role.dangerous_permissions || []).join(', ')}` : ''}`}
    >
      {isManaged && <Bot size={small ? 8 : 10} />}
      {role.name}
    </span>
  );
}

function GraphControls({ spread, setSpread, labelSize, setLabelSize, showLabels, setShowLabels, showEdgeLabels, setShowEdgeLabels, nodeCount, edgeCount }) {
  const { colors } = useTheme();
  const s = { fontSize: 11, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6 };
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', padding: '6px 0' }}>
      {setShowLabels && <label style={s}><input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} /> Labels</label>}
      {setShowEdgeLabels && <label style={s}><input type="checkbox" checked={showEdgeLabels} onChange={e => setShowEdgeLabels(e.target.checked)} /> Edge labels</label>}
      {setLabelSize && <label style={s}>Size <input type="range" min={6} max={16} value={labelSize} onChange={e => setLabelSize(+e.target.value)} style={{ width: 70, accentColor: colors.accent }} /> {labelSize}px</label>}
      {setSpread && <label style={s}>Spread <input type="range" min={-600} max={-50} value={spread} onChange={e => setSpread(+e.target.value)} style={{ width: 100, accentColor: colors.accent }} /> {spread}</label>}
      {nodeCount != null && <span style={{ fontSize: 10, color: colors.textMuted, marginLeft: 'auto' }}>{nodeCount} nodes | {edgeCount} edges</span>}
    </div>
  );
}

function autoFitZoom(svg, nodes, W, H, zoomBehavior, delay = 800) {
  setTimeout(() => {
    if (!nodes.length) return;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    nodes.forEach(n => { if (n.x != null) { x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); y0 = Math.min(y0, n.y); y1 = Math.max(y1, n.y); } });
    if (x0 === Infinity) return;
    const pad = 60;
    const scale = Math.min(W / (x1 - x0 + pad * 2), H / (y1 - y0 + pad * 2), 2) * 0.85;
    const tx = W / 2 - (x0 + x1) / 2 * scale;
    const ty = H / 2 - (y0 + y1) / 2 * scale;
    svg.transition().duration(750).call(zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }, delay);
}

function EmptyState({ icon: Icon, title, desc }) {
  const { colors } = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 }}>
      {Icon && <Icon size={40} style={{ color: colors.textMuted, opacity: 0.4 }} />}
      <div style={{ fontSize: 16, fontWeight: 600, color: colors.textSecondary, fontFamily: "'Space Grotesk', sans-serif" }}>{title}</div>
      {desc && <div style={{ fontSize: 13, color: colors.textMuted, maxWidth: 400, textAlign: 'center', lineHeight: 1.5 }}>{desc}</div>}
    </div>
  );
}

function TabBar({ tabs, active, onChange, style }) {
  const { colors } = useTheme();
  return (
    <div style={{ display: 'flex', gap: 2, overflowX: 'auto', padding: '0 4px', ...style }}>
      {tabs.map(tab => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            borderRadius: 6, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            fontSize: 13, fontWeight: isActive ? 600 : 400,
            fontFamily: "'Space Grotesk', sans-serif",
            color: isActive ? colors.accent : colors.textSecondary,
            backgroundColor: isActive ? colors.accentBg : 'transparent',
            transition: 'all 0.15s',
          }}>
            {Icon && <Icon size={14} />}
            {tab.label}
            {tab.count != null && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 8,
                backgroundColor: isActive ? colors.accent : colors.border,
                color: isActive ? '#fff' : colors.textMuted,
              }}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Collapsible({ title, defaultOpen = false, children, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  const { colors } = useTheme();
  return (
    <div>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '8px 0', border: 'none', background: 'none', cursor: 'pointer',
        color: colors.text, fontSize: 14, fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif",
      }}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {title}
        {badge}
      </button>
      {open && <div style={{ paddingLeft: 22 }}>{children}</div>}
    </div>
  );
}

// ----------------------------------------------------------------------------
// DUMP MANAGER / UPLOAD
// ----------------------------------------------------------------------------

function DumpUploader({ dumps, onAddDump, onRemoveDump, activeDumpId, onSetActive }) {
  const { colors } = useTheme();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback((files) => {
    Array.from(files).forEach(file => {
      if (!file.name.endsWith('.json')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data._meta || !data.roles || !data.channels) {
            alert('Invalid dump file: missing required fields (_meta, roles, channels)');
            return;
          }
          const label = `${data._meta.guild_name || 'Unknown'} (${new Date(data._meta.timestamp).toLocaleDateString()})`;
          onAddDump({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, label, data, fileName: file.name });
        } catch (err) {
          alert(`Failed to parse ${file.name}: ${err.message}`);
        }
      };
      reader.readAsText(file);
    });
  }, [onAddDump]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? colors.accent : colors.border}`,
          borderRadius: 10, padding: dumps.length === 0 ? 40 : 16,
          textAlign: 'center', cursor: 'pointer',
          backgroundColor: dragOver ? colors.accentBg : colors.bgAlt,
          transition: 'all 0.2s',
        }}
      >
        <input ref={fileInputRef} type="file" accept=".json" multiple onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />
        <Upload size={dumps.length === 0 ? 32 : 18} style={{ color: colors.textMuted, margin: '0 auto 8px' }} />
        <div style={{ fontSize: dumps.length === 0 ? 15 : 13, fontWeight: 500, color: colors.textSecondary, fontFamily: "'Space Grotesk', sans-serif" }}>
          {dumps.length === 0 ? 'Drop Discord dump JSON here or click to upload' : 'Add another dump'}
        </div>
        {dumps.length === 0 && (
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>
            Supports multiple files for comparison and diffing.
          </div>
        )}
      </div>

      {dumps.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {dumps.map(dump => (
            <div key={dump.id} onClick={() => onSetActive(dump.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
              borderRadius: 6, cursor: 'pointer',
              backgroundColor: dump.id === activeDumpId ? colors.accentBg : colors.bgAlt,
              border: `1px solid ${dump.id === activeDumpId ? colors.accentBorder : colors.border}`,
            }}>
              <FileJson size={16} style={{ color: dump.id === activeDumpId ? colors.accent : colors.textMuted, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {dump.data._meta?.guild_name || dump.label}
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>
                  {dump.data.summary?.total_roles} roles, {dump.data.summary?.total_channels} channels, {dump.data.summary?.cached_members} members
                  {' | '}{new Date(dump.data._meta?.timestamp).toLocaleString()}
                </div>
              </div>
              {dump.id === activeDumpId && <Check size={14} style={{ color: colors.accent, flexShrink: 0 }} />}
              <button onClick={(e) => { e.stopPropagation(); onRemoveDump(dump.id); }} style={{
                border: 'none', background: 'none', cursor: 'pointer', padding: 4,
                color: colors.textMuted, borderRadius: 4,
              }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// VIEW: DASHBOARD
// ----------------------------------------------------------------------------

function DashboardView({ dump }) {
  const { colors, isDark } = useTheme();
  const securityScore = useMemo(() => computeSecurityScore(dump), [dump]);

  const severityData = useMemo(() => {
    const issues = dump.security_analysis?.issues || [];
    return [
      { name: 'Critical', value: issues.filter(i => i.severity === 'CRITICAL').length, fill: '#dc2626' },
      { name: 'High', value: issues.filter(i => i.severity === 'HIGH').length, fill: '#ea580c' },
      { name: 'Medium', value: issues.filter(i => i.severity === 'MEDIUM').length, fill: '#ca8a04' },
      { name: 'Info', value: issues.filter(i => i.severity === 'INFO').length, fill: '#6b7280' },
    ].filter(d => d.value > 0);
  }, [dump]);

  const roleBreakdown = useMemo(() => {
    const roles = dump.roles || [];
    return [
      { name: 'Admin', value: roles.filter(r => r.has_admin).length, fill: '#dc2626' },
      { name: 'Dangerous', value: roles.filter(r => r.is_dangerous && !r.has_admin).length, fill: '#ea580c' },
      { name: 'Managed', value: roles.filter(r => r.managed && !r.is_dangerous).length, fill: '#6366f1' },
      { name: 'Safe', value: roles.filter(r => !r.is_dangerous && !r.managed).length, fill: '#16a34a' },
    ].filter(d => d.value > 0);
  }, [dump]);

  const topFindings = useMemo(() =>
    (dump.security_analysis?.issues || []).slice(0, 8),
  [dump]);

  const gradeColor = securityScore.grade === 'A' ? '#16a34a' :
    securityScore.grade === 'B' ? '#2563eb' :
    securityScore.grade === 'C' ? '#ca8a04' :
    securityScore.grade === 'D' ? '#ea580c' : '#dc2626';

  const s = dump.summary || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Server header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '4px 0' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.text, fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>
            {dump.guild?.name || 'Unknown Server'}
          </h2>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
            ID: {dump.guild?.id} | {new Date(dump._meta?.timestamp).toLocaleString()}
          </div>
        </div>
        <div style={{
          width: 64, height: 64, borderRadius: 12, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: `${gradeColor}12`, border: `2px solid ${gradeColor}40`,
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: gradeColor, lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}>
            {securityScore.grade}
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: gradeColor, opacity: 0.7 }}>SCORE</div>
        </div>
      </div>

      {/* Caveat banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 6,
        backgroundColor: isDark ? '#1e3a5f20' : '#eff6ff', border: `1px solid ${isDark ? '#1e3a5f' : '#bfdbfe'}`,
        fontSize: 12, color: isDark ? '#93c5fd' : '#1d4ed8',
      }}>
        <Info size={14} style={{ flexShrink: 0 }} />
        Member data may be incomplete ({s.cached_members} members in dump). Role and channel data is complete ({s.total_roles} roles, {s.total_channels} channels).
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        <StatCard label="Total Channels" value={s.total_channels} sub={`${s.hidden_channels} hidden`} icon={Hash} />
        <StatCard label="Total Roles" value={s.total_roles} sub={`${s.managed_roles} managed`} icon={Shield} />
        <StatCard label="Cached Members" value={s.cached_members} sub={`${s.cached_bots} bots`} icon={Users} />
        <StatCard label="Admin Roles" value={s.admin_roles} color={s.admin_roles > 2 ? '#dc2626' : undefined} icon={Crown} />
        <StatCard label="Dangerous Roles" value={s.dangerous_roles} color={s.dangerous_roles > 5 ? '#ea580c' : undefined} icon={AlertTriangle} />
        <StatCard label="Security Findings" value={dump.security_analysis?.total_issues || 0}
          sub={`${dump.security_analysis?.critical || 0} critical`}
          color={(dump.security_analysis?.critical || 0) > 0 ? '#dc2626' : undefined} icon={ShieldAlert} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>
            Findings by Severity
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={severityData} layout="vertical">
              <XAxis type="number" tick={{ fill: colors.textMuted, fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={60} tick={{ fill: colors.textSecondary, fontSize: 11 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {severityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
              <RTooltip contentStyle={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>
            Role Breakdown
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={roleBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                {roleBreakdown.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: colors.textSecondary, fontSize: 11 }}>{value}</span>} />
              <RTooltip contentStyle={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Security Score Breakdown */}
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>
          Security Score Breakdown
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{
            width: '100%', height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden',
          }}>
            <div style={{
              width: `${securityScore.score}%`, height: '100%', borderRadius: 4,
              backgroundColor: gradeColor, transition: 'width 0.5s ease',
            }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: gradeColor, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
            {securityScore.score}/100
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {securityScore.breakdown.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.textSecondary }}>
              <span>{item.label}</span>
              <span style={{ color: '#dc2626', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{item.impact}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top findings */}
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>
          Top Findings
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {topFindings.map((issue, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 8px',
              borderRadius: 4, backgroundColor: colors.bgAlt,
            }}>
              <SeverityBadge severity={issue.severity} />
              <span style={{ fontSize: 12, color: colors.text, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5, wordBreak: 'break-word' }}>
                {issue.finding}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Server config highlights */}
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>
          Server Configuration
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, fontSize: 12 }}>
          {[
            { label: 'Verification Level', value: ['None', 'Low', 'Medium', 'High', 'Very High'][dump.guild?.verification_level || 0] },
            { label: '2FA Required', value: dump.guild?.mfa_level ? 'Yes' : 'No', warn: !dump.guild?.mfa_level },
            { label: 'Content Filter', value: ['Disabled', 'No Role', 'All Members'][dump.guild?.explicit_content_filter || 0] },
            { label: 'Boost Tier', value: `Tier ${dump.guild?.premium_tier || 0} (${dump.guild?.premium_subscriber_count || 0} boosts)` },
            { label: 'Vanity URL', value: dump.guild?.vanity_url_code || 'None' },
            { label: 'Owner', value: dump.guild?.owner_id, mono: true },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${colors.border}` }}>
              <span style={{ color: colors.textSecondary }}>{item.label}</span>
              <span style={{
                color: item.warn ? colors.danger : colors.text, fontWeight: item.warn ? 600 : 400,
                ...(item.mono && { fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }),
              }}>{item.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------
// VIEW: ESCALATION GRAPH (d3-force, imperative)
// ----------------------------------------------------------------------------

function EscalationView({ dump, onSelectMember }) {
  const { colors, isDark } = useTheme();
  const [selectedSource, setSelectedSource] = useState(null);
  const [spread, setSpread] = useState(-250);
  const [labelSize, setLabelSize] = useState(9);
  const [showLabels, setShowLabels] = useState(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const graphContainerRef = useRef(null);
  const escSimRef = useRef(null);

  const escalationPaths = useMemo(() => analyzeEscalationPaths(dump.roles || []), [dump.roles]);
  const selectedPath = useMemo(() => {
    if (!selectedSource) return escalationPaths[0] || null;
    return escalationPaths.find(p => p.source.id === selectedSource) || null;
  }, [selectedSource, escalationPaths]);

  const graphData = useMemo(() => {
    if (!selectedPath) return { nodes: [], links: [] };
    const nodes = [];
    const links = [];
    const nodeMap = {};
    const addNode = (id, label, layer, type, data) => {
      if (nodeMap[id]) return;
      const node = { id, label, layer, type, data };
      nodes.push(node);
      nodeMap[id] = node;
    };

    addNode(selectedPath.source.id, selectedPath.source.name, 0, 'source', selectedPath.source);
    selectedPath.assignable.filter(a => a.role.is_dangerous).forEach(({ role, via }) => {
      addNode(role.id, role.name, 1, 'dangerous', role);
      links.push({ source: via.id, target: role.id, type: 'assigns' });
    });
    const safe = selectedPath.assignable.filter(a => !a.role.is_dangerous);
    if (safe.length > 0 && safe.length <= 8) {
      safe.forEach(({ role, via }) => {
        addNode(role.id, role.name, 1, 'safe', role);
        links.push({ source: via.id, target: role.id, type: 'assigns' });
      });
    } else if (safe.length > 8) {
      addNode('safe-collapsed', `+${safe.length} safe roles`, 1, 'collapsed', {});
      links.push({ source: selectedPath.source.id, target: 'safe-collapsed', type: 'assigns' });
    }

    const permSet = new Set();
    selectedPath.assignable.filter(a => a.role.is_dangerous).forEach(({ role }) => {
      (role.dangerous_permissions || []).forEach(p => {
        const pid = `perm-${p}`;
        if (!permSet.has(p)) { permSet.add(p); addNode(pid, p, 2, 'permission', { perm: p }); }
        links.push({ source: role.id, target: pid, type: 'grants' });
      });
    });

    selectedPath.blocked.slice(0, 6).forEach(({ from, to }) => {
      addNode(`blocked-${to.id}`, to.name, 1, 'blocked', to);
      links.push({ source: from.id, target: `blocked-${to.id}`, type: 'blocked' });
    });
    if (selectedPath.blocked.length > 6) {
      addNode('blocked-more', `+${selectedPath.blocked.length - 6} managed`, 1, 'blocked', {});
      links.push({ source: selectedPath.source.id, target: 'blocked-more', type: 'blocked' });
    }
    return { nodes, links };
  }, [selectedPath]);

  // D3 imperative rendering
  useEffect(() => {
    const container = graphContainerRef.current;
    if (!container || graphData.nodes.length === 0) return;

    d3.select(container).selectAll('*').remove();

    const W = container.clientWidth || 900;
    const H = 480;
    const layerX = { 0: W * 0.08, 1: W * 0.45, 2: W * 0.85 };

    const nodeRadius = (d) => d.type === 'source' ? 26 : d.type === 'permission' ? 16 : 20;

    const typeColor = {
      source: { fill: isDark ? '#6366f1' : '#4f46e5', stroke: isDark ? '#818cf8' : '#6366f1', text: '#fff' },
      dangerous: { fill: isDark ? '#9a3412' : '#fed7aa', stroke: '#ea580c', text: isDark ? '#fdba74' : '#9a3412' },
      safe: { fill: isDark ? '#14532d' : '#dcfce7', stroke: '#22c55e', text: isDark ? '#86efac' : '#166534' },
      collapsed: { fill: isDark ? '#1f2937' : '#f3f4f6', stroke: isDark ? '#4b5563' : '#d1d5db', text: isDark ? '#9ca3af' : '#6b7280' },
      permission: { fill: isDark ? '#7f1d1d' : '#fee2e2', stroke: '#ef4444', text: isDark ? '#fca5a5' : '#b91c1c' },
      blocked: { fill: isDark ? '#1f2937' : '#f9fafb', stroke: isDark ? '#4b5563' : '#d1d5db', text: isDark ? '#6b7280' : '#9ca3af' },
    };

    // Clone data for d3 mutation
    const nodes = graphData.nodes.map(d => ({ ...d, x: layerX[d.layer] || W / 2, y: H / 2 + (Math.random() - 0.5) * 100 }));
    const links = graphData.links.map(d => ({ ...d }));

    const svg = d3.select(container)
      .append('svg')
      .attr('width', W)
      .attr('height', H)
      .style('border-radius', '8px')
      .style('background', isDark ? '#0c0c1d' : '#fafbfe')
      .style('border', `1px solid ${isDark ? '#2a2a4a' : '#e2e4e9'}`)
      .style('cursor', 'grab')
      .style('font-family', "'JetBrains Mono', monospace");

    // Defs for arrows and glow
    const defs = svg.append('defs');
    defs.append('marker').attr('id', 'esc-arr').attr('viewBox', '0 0 12 12').attr('refX', 10).attr('refY', 6)
      .attr('markerWidth', 8).attr('markerHeight', 8).attr('orient', 'auto')
      .append('path').attr('d', 'M 0 0 L 12 6 L 0 12 z').attr('fill', isDark ? '#818cf8' : '#6366f1').attr('opacity', 0.7);
    defs.append('marker').attr('id', 'esc-arr-dim').attr('viewBox', '0 0 12 12').attr('refX', 10).attr('refY', 6)
      .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
      .append('path').attr('d', 'M 0 0 L 12 6 L 0 12 z').attr('fill', isDark ? '#4b5563' : '#d1d5db').attr('opacity', 0.4);

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    filter.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).join('feMergeNode').attr('in', d => d);

    const g = svg.append('g');

    // Zoom
    const zoom = d3.zoom().scaleExtent([0.3, 4]).on('zoom', (e) => {
      g.attr('transform', e.transform);
      svg.style('cursor', 'grabbing');
    }).on('end', () => svg.style('cursor', 'grab'));
    svg.call(zoom);

    // Adjacency map
    const adj = {};
    links.forEach(l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      adj[sid] = adj[sid] || new Set(); adj[sid].add(tid);
      adj[tid] = adj[tid] || new Set(); adj[tid].add(sid);
    });
    const isConnected = (a, b) => a === b || (adj[a] && adj[a].has(b));

    // Simulation
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100).strength(0.35))
      .force('charge', d3.forceManyBody().strength(spread).distanceMax(400))
      .force('x', d3.forceX().x(d => layerX[d.layer] || W / 2).strength(0.18))
      .force('y', d3.forceY(H / 2).strength(0.04))
      .force('collide', d3.forceCollide().radius(d => nodeRadius(d) + 12).iterations(2))
      .alphaDecay(0.025);

    escSimRef.current = sim;
    autoFitZoom(svg, nodes, W, H, zoom);

    // Links
    const linkG = g.append('g');
    const linkEls = linkG.selectAll('line').data(links).join('line')
      .attr('stroke', d => d.type === 'blocked' ? (isDark ? '#4b5563' : '#d1d5db') : (isDark ? '#6366f1' : '#818cf8'))
      .attr('stroke-width', d => d.type === 'blocked' ? 1 : 2)
      .attr('stroke-dasharray', d => d.type === 'blocked' ? '6,4' : 'none')
      .attr('opacity', d => d.type === 'blocked' ? 0.3 : 0.5)
      .attr('marker-end', d => d.type === 'blocked' ? 'url(#esc-arr-dim)' : 'url(#esc-arr)');

    // Node groups
    const nodeG = g.append('g');
    const nodeEls = nodeG.selectAll('g').data(nodes).join('g').attr('cursor', 'pointer');

    // Draw shapes per type
    nodeEls.each(function(d) {
      const el = d3.select(this);
      const r = nodeRadius(d);
      const tc = typeColor[d.type] || typeColor.collapsed;

      if (d.type === 'permission') {
        // Diamond
        el.append('polygon')
          .attr('points', `0,${-r} ${r},0 0,${r} ${-r},0`)
          .attr('fill', tc.fill).attr('stroke', tc.stroke).attr('stroke-width', 1.5);
      } else if (d.type === 'source') {
        // Double ring
        el.append('circle').attr('r', r + 4).attr('fill', 'none').attr('stroke', tc.stroke).attr('stroke-width', 1).attr('opacity', 0.4);
        el.append('circle').attr('r', r).attr('fill', tc.fill).attr('stroke', tc.stroke).attr('stroke-width', 2);
      } else {
        // Rounded rect
        el.append('rect')
          .attr('x', -r).attr('y', -r * 0.65).attr('width', r * 2).attr('height', r * 1.3)
          .attr('rx', 5).attr('fill', tc.fill).attr('stroke', tc.stroke).attr('stroke-width', 1.5)
          .attr('stroke-dasharray', d.type === 'blocked' ? '5,3' : 'none');
      }

      // Label below
      el.append('text')
        .attr('y', r + 14).attr('text-anchor', 'middle')
        .attr('fill', isDark ? '#c4c4e0' : '#4b5563')
        .attr('font-size', 9).attr('font-weight', 500)
        .text(d.label.length > 22 ? d.label.slice(0, 19) + '...' : d.label);

      // Blocked X
      if (d.type === 'blocked') {
        el.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
          .attr('fill', isDark ? '#6b7280' : '#9ca3af').attr('font-size', 14).text('✗');
      }
    });

    // Hover: highlight connected, dim others
    nodeEls
      .on('mouseenter', (event, d) => {
        nodeEls.transition().duration(150)
          .attr('opacity', n => isConnected(d.id, n.id) ? 1 : 0.12);
        linkEls.transition().duration(150)
          .attr('opacity', l => {
            const sid = l.source.id || l.source;
            const tid = l.target.id || l.target;
            return (sid === d.id || tid === d.id) ? 0.9 : 0.05;
          })
          .attr('stroke-width', l => {
            const sid = l.source.id || l.source;
            const tid = l.target.id || l.target;
            return (sid === d.id || tid === d.id) ? 3 : 1;
          });

        // Glow on hovered node
        d3.select(event.currentTarget).select('circle, rect, polygon')
          .attr('filter', 'url(#glow)');
      })
      .on('mouseleave', () => {
        nodeEls.transition().duration(200).attr('opacity', 1);
        linkEls.transition().duration(200)
          .attr('opacity', l => l.type === 'blocked' ? 0.3 : 0.5)
          .attr('stroke-width', l => l.type === 'blocked' ? 1 : 2);
        nodeEls.selectAll('circle, rect, polygon').attr('filter', null);
      });

    // Drag
    nodeEls.call(d3.drag()
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null; d.fy = null;
      })
    );

    // Tick
    sim.on('tick', () => {
      linkEls
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      nodeEls.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [graphData, isDark, colors]);

  // Dynamic spread for escalation
  useEffect(() => {
    if (escSimRef.current) {
      escSimRef.current.force('charge', d3.forceManyBody().strength(spread).distanceMax(400));
      escSimRef.current.alpha(0.5).restart();
    }
  }, [spread]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text, fontFamily: "'Space Grotesk', sans-serif" }}>Source:</span>
        {escalationPaths.map(path => (
          <button key={path.source.id} onClick={() => setSelectedSource(path.source.id)} style={{
            padding: '4px 10px', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            border: `1px solid ${selectedPath?.source.id === path.source.id ? colors.accent : colors.border}`,
            backgroundColor: selectedPath?.source.id === path.source.id ? colors.accentBg : colors.bgAlt,
            color: selectedPath?.source.id === path.source.id ? colors.accent : colors.textSecondary,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {path.source.name} <span style={{ opacity: 0.5 }}>pos {path.source.position}</span>
          </button>
        ))}
      </div>

      {selectedPath && (
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, fontFamily: "'Space Grotesk', sans-serif" }}>{selectedPath.source.name}</div>
              <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Position {selectedPath.source.position} | MANAGE_ROLES</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[{ v: selectedPath.assignable.length, l: 'Assignable', c: colors.text }, { v: selectedPath.blocked.length, l: 'Blocked', c: '#dc2626' }, { v: selectedPath.gainedPermissions.length, l: 'Gained', c: colors.accent }].map(s => (
                <div key={s.l} style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 6, backgroundColor: colors.bgAlt }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: colors.textMuted }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '10px 14px', borderRadius: 6, fontSize: 12, lineHeight: 1.6, backgroundColor: isDark ? '#1e1b4b20' : '#eef2ff', border: `1px solid ${isDark ? '#3730a3' : '#c7d2fe'}`, color: isDark ? '#a5b4fc' : '#4338ca' }}>
            {selectedPath.blocked.length > 0 && <div style={{ marginBottom: 4 }}><strong>Managed roles blocked:</strong> {selectedPath.blocked.slice(0, 8).map(b => b.to.name).join(', ')}{selectedPath.blocked.length > 8 && ` +${selectedPath.blocked.length - 8} more`} — bot-owned roles, cannot be reassigned.</div>}
            {selectedPath.assignable.filter(a => a.role.is_dangerous).length > 0 && <div style={{ marginBottom: 4 }}><strong>Dangerous assignable:</strong> {selectedPath.assignable.filter(a => a.role.is_dangerous).map(a => a.role.name).join(', ')}</div>}
            {selectedPath.gainedPermissions.length > 0 && <div style={{ marginBottom: 4 }}><strong>Lateral escalation gains:</strong> {selectedPath.gainedPermissions.join(', ')}</div>}
            {selectedPath.deadEnd && <div><strong>Dead end:</strong> No further escalation from assignable roles.</div>}
            {selectedPath.hasChain && <div><strong>Chain detected:</strong> {selectedPath.maxDepth} hops deep.</div>}
          </div>
        </Card>
      )}

      <Card style={{ padding: 16 }}>
        <GraphControls spread={spread} setSpread={setSpread} labelSize={labelSize} setLabelSize={setLabelSize}
          showLabels={showLabels} setShowLabels={setShowLabels} showEdgeLabels={showEdgeLabels} setShowEdgeLabels={setShowEdgeLabels}
          nodeCount={graphData.nodes.length} edgeCount={graphData.links.length} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 10, color: colors.textMuted }}>
          {[{ c: isDark ? '#6366f1' : '#4f46e5', l: '● Source' }, { c: '#ea580c', l: '■ Dangerous' }, { c: '#22c55e', l: '■ Safe' }, { c: '#ef4444', l: '◆ Permission' }, { c: isDark ? '#4b5563' : '#d1d5db', l: '┈ Blocked' }].map(x => (
            <span key={x.l} style={{ color: x.c }}>{x.l}</span>
          ))}
        </div>
        <div ref={graphContainerRef} style={{ width: '100%', minHeight: 480 }}>
          {graphData.nodes.length === 0 && <EmptyState icon={Workflow} title="No escalation paths" desc="No roles with MANAGE_ROLES found (excluding admin roles)." />}
        </div>
      </Card>

      {/* Member blast radius list */}
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>Member Blast Radius</div>
        <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>Damage potential if a member account is compromised.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(dump.members || [])
            .map(m => ({ member: m, blast: computeBlastRadius(m, dump.roles || [], dump.channels || []) }))
            .filter(({ blast }) => blast && blast.blastScore > 0)
            .sort((a, b) => b.blast.blastScore - a.blast.blastScore)
            .slice(0, 20)
            .map(({ member, blast }) => {
              const barColor = blast.threatLevel === 'critical' ? '#dc2626' : blast.threatLevel === 'high' ? '#ea580c' : blast.threatLevel === 'medium' ? '#ca8a04' : '#16a34a';
              return (
                <div key={member.id} onClick={() => onSelectMember?.(member)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 4, cursor: 'pointer', backgroundColor: colors.bgAlt }}>
                  <div style={{ width: 32, textAlign: 'right', fontSize: 14, fontWeight: 700, color: barColor, fontFamily: "'JetBrains Mono', monospace" }}>{blast.blastScore}</div>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}>
                    <div style={{ width: `${blast.blastScore}%`, height: '100%', borderRadius: 3, backgroundColor: barColor }} />
                  </div>
                  <div style={{ minWidth: 120, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: colors.text }}>{memberName(member)}</div>
                  <div style={{ fontSize: 10, color: colors.textMuted, whiteSpace: 'nowrap' }}>{blast.dangerousPermissions.length} perms{blast.userOverwrites.length > 0 && ` | ${blast.userOverwrites.length} ow`}</div>
                </div>
              );
            })}
        </div>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------
// VIEW: ROLE HIERARCHY (d3-zoom, imperative)
// ----------------------------------------------------------------------------

function RoleHierarchyView({ dump, onSelectRole }) {
  const { colors, isDark } = useTheme();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const allRoles = dump.roles || [];
  const roles = useMemo(() => {
    let r = allRoles;
    if (filter === 'dangerous') r = r.filter(x => x.is_dangerous);
    if (filter === 'managed') r = r.filter(x => x.managed);
    if (filter === 'staff') r = r.filter(x => x.position >= 200);
    if (searchTerm) { const t = searchTerm.toLowerCase(); r = r.filter(x => x.name.toLowerCase().includes(t)); }
    return r;
  }, [allRoles, filter, searchTerm]);

  const maxPos = useMemo(() => Math.max(...allRoles.map(r => r.position), 1), [allRoles]);
  const manageRolesHolders = useMemo(() => allRoles.filter(r => r.permissions_decoded?.MANAGE_ROLES && !r.has_admin), [allRoles]);

  const getColor = (role) => {
    if (role.has_admin) return '#dc2626';
    if (role.permissions_decoded?.MANAGE_GUILD || role.permissions_decoded?.BAN_MEMBERS) return '#ea580c';
    if (role.is_dangerous) return '#ca8a04';
    if (role.managed) return '#6366f1';
    return '#16a34a';
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || roles.length === 0) return;
    d3.select(container).selectAll('*').remove();

    const W = container.clientWidth || 700;
    const NODE_H = 28;
    const NODE_W = 170;
    const PAD = 50;
    const ROW_H = NODE_H + 8;
    const H = Math.max(500, roles.length * ROW_H + PAD * 2);

    // Use rank-based Y positioning (collapses gaps between filtered roles)
    const sortedPositions = roles.map(r => r.position).sort((a, b) => b - a);
    const yScale = (pos) => {
      const rank = sortedPositions.indexOf(pos);
      return PAD + rank * ROW_H;
    };

    const svg = d3.select(container).append('svg')
      .attr('width', W).attr('height', H)
      .style('border-radius', '8px')
      .style('background', isDark ? '#0c0c1d' : '#fafbfe')
      .style('border', `1px solid ${isDark ? '#2a2a4a' : '#e2e4e9'}`)
      .style('cursor', 'grab')
      .style('font-family', "'JetBrains Mono', monospace");

    const g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([0.2, 5]).on('zoom', (e) => g.attr('transform', e.transform)));

    // Position labels (show actual position numbers on each role row)
    // No fixed axis lines needed with rank-based layout

    // MANAGE_ROLES range arcs (only for holders visible in current filter)
    manageRolesHolders.forEach(holder => {
      const holderRank = sortedPositions.indexOf(holder.position);
      if (holderRank === -1) return;
      const holderY = PAD + holderRank * ROW_H;
      const bottomY = PAD + (roles.length - 1) * ROW_H + NODE_H;
      // Find how many roles below this holder are assignable (non-managed, lower position)
      const assignableBelow = roles.filter(r => r.position < holder.position && !r.managed).length;
      g.append('rect')
        .attr('x', PAD + 5).attr('y', holderY)
        .attr('width', W - PAD - 30).attr('height', Math.max(0, bottomY - holderY))
        .attr('fill', isDark ? '#6366f1' : '#818cf8').attr('opacity', 0.04).attr('rx', 4);
      g.append('line')
        .attr('x1', PAD + 5).attr('y1', holderY).attr('x2', PAD + 5).attr('y2', bottomY)
        .attr('stroke', isDark ? '#6366f1' : '#818cf8').attr('stroke-width', 2).attr('opacity', 0.25).attr('stroke-dasharray', '4,3');
      g.append('text')
        .attr('x', PAD + 10).attr('y', holderY - 6)
        .attr('fill', isDark ? '#818cf8' : '#6366f1').attr('font-size', 9).attr('opacity', 0.5)
        .text(`↓ ${holder.name} can assign ${assignableBelow} roles`);
    });

    // Role nodes
    const roleGroups = g.selectAll('.role-node').data(roles).join('g')
      .attr('class', 'role-node')
      .attr('transform', d => `translate(${PAD + 60}, ${yScale(d.position)})`)
      .attr('cursor', 'pointer');

    roleGroups.append('rect')
      .attr('x', 0).attr('y', -NODE_H / 2).attr('width', NODE_W).attr('height', NODE_H)
      .attr('rx', 4)
      .attr('fill', d => isDark ? '#1a1a2e' : '#fff')
      .attr('stroke', d => getColor(d))
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', d => d.managed ? '4,3' : 'none');

    // Color dot
    roleGroups.append('circle')
      .attr('cx', 10).attr('cy', 0).attr('r', 4)
      .attr('fill', d => getColor(d));

    // Name
    roleGroups.append('text')
      .attr('x', 20).attr('y', 3)
      .attr('fill', isDark ? '#e0e0ff' : '#1a1a2a')
      .attr('font-size', 10).attr('font-weight', 500)
      .text(d => d.name.length > 16 ? d.name.slice(0, 13) + '...' : d.name);

    // Position label
    roleGroups.append('text')
      .attr('x', NODE_W + 8).attr('y', 3)
      .attr('fill', isDark ? '#6b7280' : '#9ca3af').attr('font-size', 8)
      .text(d => {
        const holders = (dump.members || []).filter(m => m.roles.some(r => r.id === d.id));
        return `${d.position}${d.managed ? ' M' : ''}${d.has_admin ? ' A' : ''}${holders.length ? ` (${holders.length})` : ''}`;
      });

    // Hover
    roleGroups
      .on('mouseenter', function(event, d) {
        d3.select(this).select('rect')
          .attr('stroke-width', 2.5)
          .attr('filter', 'drop-shadow(0 0 4px rgba(99,102,241,0.4))');

        // If this role has MANAGE_ROLES, highlight everything below its position
        if (d.permissions_decoded?.MANAGE_ROLES && !d.has_admin) {
          roleGroups.transition().duration(150)
            .attr('opacity', n => n.position < d.position && !n.managed ? 1 : (n.id === d.id ? 1 : 0.15));
        }
      })
      .on('mouseleave', function() {
        d3.select(this).select('rect').attr('stroke-width', 1.5).attr('filter', null);
        roleGroups.transition().duration(200).attr('opacity', 1);
      })
      .on('click', (event, d) => onSelectRole?.(d));

    return () => {};
  }, [roles, maxPos, isDark, colors, dump.members, manageRolesHolders]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Filter roles..." style={{ width: 200 }} />
        {['all', 'dangerous', 'managed', 'staff'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 10px', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            border: `1px solid ${filter === f ? colors.accent : colors.border}`,
            backgroundColor: filter === f ? colors.accentBg : 'transparent',
            color: filter === f ? colors.accent : colors.textSecondary,
            fontFamily: "'Space Grotesk', sans-serif", textTransform: 'capitalize',
          }}>{f}</button>
        ))}
        <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 'auto' }}>{roles.length} roles | Scroll to zoom, drag to pan</span>
      </div>

      <Card style={{ overflow: 'hidden' }}>
        <div ref={containerRef} style={{ width: '100%', minHeight: 500 }}>
          {roles.length === 0 && <EmptyState icon={Layers} title="No roles match" desc="Try adjusting filters." />}
        </div>
        <div style={{ display: 'flex', gap: 14, padding: '10px 16px', borderTop: `1px solid ${colors.border}`, fontSize: 11, color: colors.textMuted }}>
          {[{ c: '#dc2626', l: 'Admin' }, { c: '#ea580c', l: 'High' }, { c: '#ca8a04', l: 'Dangerous' }, { c: '#6366f1', l: 'Managed' }, { c: '#16a34a', l: 'Safe' }].map(x => (
            <span key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: x.c }} /> {x.l}
            </span>
          ))}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 16, height: 8, borderRadius: 2, border: `1px dashed ${isDark ? '#6366f1' : '#818cf8'}40`, backgroundColor: `${isDark ? '#6366f1' : '#818cf8'}08` }} /> MANAGE_ROLES range
          </span>
        </div>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------
// BLAST RADIUS NETWORK GRAPH (mini d3-force, imperative)
// ----------------------------------------------------------------------------

function BlastRadiusGraph({ member, roles, channels }) {
  const { colors, isDark } = useTheme();
  const containerRef = useRef(null);

  const blast = useMemo(() => computeBlastRadius(member, roles, channels), [member, roles, channels]);

  const graphData = useMemo(() => {
    if (!blast) return { nodes: [], links: [] };
    const nodes = [];
    const links = [];
    const seen = new Set();
    const add = (id, label, type, risk) => { if (seen.has(id)) return; seen.add(id); nodes.push({ id, label, type, risk: risk || 0 }); };

    add(member.id, member.display_name || member.username, 'member', blast.blastScore);

    const memberRoles = roles.filter(r => member.roles.some(mr => mr.id === r.id) && r.name !== '@everyone');
    memberRoles.forEach(r => {
      add(r.id, r.name, 'role', r.is_dangerous ? 60 : 10);
      links.push({ source: member.id, target: r.id });
    });

    blast.dangerousPermissions.forEach(p => {
      const pid = `p-${p}`;
      add(pid, p, 'perm', 70);
      memberRoles.forEach(r => { if (r.permissions_decoded?.[p]) links.push({ source: r.id, target: pid }); });
    });

    blast.userOverwrites.slice(0, 6).forEach(({ channel }) => {
      const cid = `c-${channel.id}`;
      add(cid, '#' + channel.name, 'channel', 40);
      links.push({ source: member.id, target: cid });
    });

    return { nodes, links };
  }, [blast, member, roles]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || graphData.nodes.length === 0) return;
    d3.select(container).selectAll('*').remove();

    const W = container.clientWidth || 400;
    const H = 380;

    const riskColor = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 100]);

    const nodes = graphData.nodes.map(d => ({ ...d }));
    const links = graphData.links.map(d => ({ ...d }));

    const svg = d3.select(container).append('svg')
      .attr('width', W).attr('height', H)
      .style('border-radius', '6px')
      .style('background', isDark ? '#0c0c1d' : '#fafbfe')
      .style('border', `1px solid ${isDark ? '#2a2a4a' : '#e2e4e9'}`)
      .style('font-family', "'JetBrains Mono', monospace");

    const g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([0.5, 3]).on('zoom', (e) => g.attr('transform', e.transform)));

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(50).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-100).distanceMax(180))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide(16))
      .alphaDecay(0.04);

    const linkEls = g.selectAll('line').data(links).join('line')
      .attr('stroke', isDark ? '#4b5563' : '#d1d5db').attr('stroke-width', 1).attr('opacity', 0.5);

    const nodeEls = g.selectAll('g.bnode').data(nodes).join('g').attr('class', 'bnode');

    nodeEls.each(function(d) {
      const el = d3.select(this);
      if (d.type === 'member') {
        el.append('circle').attr('r', 14).attr('fill', riskColor(d.risk)).attr('stroke', isDark ? '#e0e0ff' : '#1a1a2a').attr('stroke-width', 2);
      } else if (d.type === 'perm') {
        el.append('polygon').attr('points', '0,-10 10,0 0,10 -10,0').attr('fill', riskColor(d.risk)).attr('stroke', '#ef4444').attr('stroke-width', 1);
      } else if (d.type === 'channel') {
        el.append('rect').attr('x', -10).attr('y', -8).attr('width', 20).attr('height', 16).attr('rx', 3)
          .attr('fill', isDark ? '#1e3a5f' : '#dbeafe').attr('stroke', '#3b82f6').attr('stroke-width', 1);
      } else {
        el.append('rect').attr('x', -10).attr('y', -8).attr('width', 20).attr('height', 16).attr('rx', 4)
          .attr('fill', d.risk > 30 ? riskColor(d.risk) : (isDark ? '#1a1a2e' : '#fff')).attr('stroke', d.risk > 30 ? '#ea580c' : (isDark ? '#4b5563' : '#d1d5db')).attr('stroke-width', 1);
      }
      el.append('text').attr('y', d.type === 'member' ? 24 : 20).attr('text-anchor', 'middle')
        .attr('fill', isDark ? '#9ca3af' : '#6b7280').attr('font-size', 8)
        .text(d.label?.length > 14 ? d.label.slice(0, 11) + '...' : d.label);
    });

    nodeEls.call(d3.drag()
      .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
    );

    sim.on('tick', () => {
      linkEls.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      nodeEls.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [graphData, isDark, colors]);

  if (graphData.nodes.length === 0) return null;

  return (
    <Card style={{ padding: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" }}>Blast Radius Network</div>
      <div ref={containerRef} style={{ width: '100%', minHeight: 400 }} />
    </Card>
  );
}

// ----------------------------------------------------------------------------
// PERMISSION HEAT MAP (MITRE ATT&CK Navigator pattern)
// ----------------------------------------------------------------------------

function PermissionMatrix({ dump }) {
  const { colors, isDark } = useTheme();
  const containerRef = useRef(null);

  const dangerousRoles = useMemo(() =>
    (dump.roles || []).filter(r => r.is_dangerous && r.name !== '@everyone').sort((a, b) => b.position - a.position),
  [dump.roles]);

  const permColumns = useMemo(() =>
    DANGEROUS_PERMS.filter(p => dangerousRoles.some(r => r.permissions_decoded?.[p])),
  [dangerousRoles]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || dangerousRoles.length === 0) return;
    d3.select(container).selectAll('*').remove();

    const CELL = 28;
    const LABEL_W = 140;
    const HEADER_H = 90;
    const W = LABEL_W + permColumns.length * CELL + 30;
    const H = HEADER_H + dangerousRoles.length * CELL + 20;

    const riskColor = (perm) => {
      const tier = PERM_CATEGORIES[perm]?.tier;
      if (tier === 'critical') return '#dc2626';
      if (tier === 'high') return '#ea580c';
      if (tier === 'medium') return '#ca8a04';
      return '#2563eb';
    };

    const svg = d3.select(container).append('svg')
      .attr('width', W).attr('height', H)
      .style('font-family', "'JetBrains Mono', monospace");

    // Column headers (rotated)
    permColumns.forEach((perm, ci) => {
      const x = LABEL_W + ci * CELL + CELL / 2;
      svg.append('text')
        .attr('x', x).attr('y', HEADER_H - 8)
        .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
        .attr('transform', `rotate(-50, ${x}, ${HEADER_H - 8})`)
        .attr('fill', isDark ? '#9ca3af' : '#6b7280').attr('font-size', 8)
        .text(perm.replace('MANAGE_', 'M_').replace('MODERATE_', 'MOD_').replace('MENTION_', 'MNT_'));
    });

    // Rows
    dangerousRoles.forEach((role, ri) => {
      const y = HEADER_H + ri * CELL;

      // Row label
      svg.append('text')
        .attr('x', LABEL_W - 8).attr('y', y + CELL / 2 + 1)
        .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
        .attr('fill', isDark ? '#c4c4e0' : '#4b5563').attr('font-size', 9)
        .text(role.name.length > 16 ? role.name.slice(0, 13) + '...' : role.name);

      // Cells
      permColumns.forEach((perm, ci) => {
        const x = LABEL_W + ci * CELL;
        const has = role.permissions_decoded?.[perm];
        const cell = svg.append('g');

        cell.append('rect')
          .attr('x', x + 1).attr('y', y + 1).attr('width', CELL - 2).attr('height', CELL - 2)
          .attr('rx', 3)
          .attr('fill', has ? riskColor(perm) : (isDark ? '#1a1a2e' : '#f9fafb'))
          .attr('stroke', isDark ? '#2a2a4a' : '#e5e7eb').attr('stroke-width', 0.5)
          .attr('opacity', has ? 0.85 : 0.4);

        if (has) {
          cell.append('text')
            .attr('x', x + CELL / 2).attr('y', y + CELL / 2 + 1)
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
            .attr('fill', '#fff').attr('font-size', 10).attr('font-weight', 600)
            .text('●');
        }

        // Hover tooltip
        cell.on('mouseenter', function() {
          d3.select(this).select('rect').attr('stroke', isDark ? '#818cf8' : '#6366f1').attr('stroke-width', 2);
          tooltip.style('display', 'block')
            .html(`<strong>${role.name}</strong>: ${PERM_CATEGORIES[perm]?.label || perm}<br/><span style="opacity:0.7">${PERM_CATEGORIES[perm]?.desc || ''}</span>`);
        })
        .on('mouseleave', function() {
          d3.select(this).select('rect').attr('stroke', isDark ? '#2a2a4a' : '#e5e7eb').attr('stroke-width', 0.5);
          tooltip.style('display', 'none');
        });
      });
    });

    // Tooltip div
    const tooltip = d3.select(container).append('div')
      .style('display', 'none')
      .style('position', 'relative')
      .style('margin-top', '8px')
      .style('padding', '6px 10px')
      .style('border-radius', '4px')
      .style('font-size', '11px')
      .style('line-height', '1.4')
      .style('background', isDark ? '#1a1a2e' : '#f9fafb')
      .style('border', `1px solid ${isDark ? '#2a2a4a' : '#e5e7eb'}`)
      .style('color', isDark ? '#e0e0ff' : '#1a1a2a');

    return () => {};
  }, [dangerousRoles, permColumns, isDark, colors]);

  return (
    <Card style={{ padding: 16, overflow: 'auto', marginTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>Permission Matrix</div>
      <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 12 }}>Dangerous permissions by role. Hover for details.</div>
      <div ref={containerRef} style={{ width: '100%' }}>
        {dangerousRoles.length === 0 && <div style={{ fontSize: 12, color: colors.textMuted }}>No dangerous roles found.</div>}
      </div>
    </Card>
  );
}// ----------------------------------------------------------------------------
// VIEW: CHANNEL OVERWRITES
// ----------------------------------------------------------------------------

function OverwriteMapView({ dump }) {
  const { colors, isDark } = useTheme();
  const [viewMode, setViewMode] = useState('users');
  const [permFilter, setPermFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);

  const userOverwrites = useMemo(() => computeUserOverwriteAnalysis(dump.channels || []), [dump.channels]);

  const dangerousPerms = useMemo(() => {
    const perms = new Set();
    (dump.channels || []).forEach(ch => {
      (ch.permission_overwrites || []).forEach(ow => {
        (ow.dangerous_allows || []).forEach(p => perms.add(p));
      });
    });
    return [...perms].sort();
  }, [dump.channels]);

  const filteredChannels = useMemo(() => {
    return (dump.channels || []).filter(ch => {
      if (!ch.has_dangerous_overwrites && viewMode === 'dangerous') return false;
      if (searchTerm && !ch.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (permFilter !== 'all') {
        return ch.permission_overwrites?.some(ow =>
          (ow.dangerous_allows || []).includes(permFilter)
        );
      }
      return ch.permission_overwrites?.length > 0;
    });
  }, [dump.channels, viewMode, permFilter, searchTerm]);

  const totalUserOverwrites = userOverwrites.reduce((sum, u) => sum + u.channels.length, 0);
  const dangerousUserCount = userOverwrites.filter(u => u.dangerousCount > 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Summary banner */}
      <div style={{
        display: 'flex', gap: 16, padding: '12px 16px', borderRadius: 8,
        backgroundColor: isDark ? '#7f1d1d20' : '#fef2f2', border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{totalUserOverwrites}</div>
          <div style={{ fontSize: 10, color: colors.textMuted }}>User Overwrites</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#ea580c' }}>{dangerousUserCount}</div>
          <div style={{ fontSize: 10, color: colors.textMuted }}>Users w/ Dangerous</div>
        </div>
        <div style={{ flex: 1, fontSize: 12, color: isDark ? '#fca5a5' : '#991b1b', display: 'flex', alignItems: 'center' }}>
          User-specific overwrites persist even after role removal and are invisible in the normal Discord UI. They are the primary sleeper threat vector.
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Filter..." style={{ width: 200 }} />
        {['users', 'channels', 'dangerous', 'stale'].map(m => (
          <button key={m} onClick={() => setViewMode(m)} style={{
            padding: '5px 10px', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            border: `1px solid ${viewMode === m ? colors.accent : colors.border}`,
            backgroundColor: viewMode === m ? colors.accentBg : 'transparent',
            color: viewMode === m ? colors.accent : colors.textSecondary,
            fontFamily: "'Space Grotesk', sans-serif", textTransform: 'capitalize',
          }}>{m}</button>
        ))}
        <select value={permFilter} onChange={e => setPermFilter(e.target.value)} style={{
          padding: '5px 8px', borderRadius: 5, fontSize: 12, border: `1px solid ${colors.border}`,
          backgroundColor: colors.inputBg, color: colors.text, fontFamily: "'Space Grotesk', sans-serif",
        }}>
          <option value="all">All permissions</option>
          {dangerousPerms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* User overwrites view */}
      {viewMode === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {userOverwrites
            .filter(u => {
              if (searchTerm && !u.id.includes(searchTerm) && !u.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
              if (permFilter !== 'all') return u.channels.some(ch => ch.dangerous.includes(permFilter));
              return true;
            })
            .map(user => {
              const isExpanded = expandedUser === user.id;
              return (
                <Card key={user.id} style={{ overflow: 'hidden' }}>
                  <div onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer',
                      borderLeft: `3px solid ${user.dangerousCount > 3 ? '#dc2626' : user.dangerousCount > 0 ? '#ea580c' : '#16a34a'}`,
                    }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: colors.text, fontFamily: "'JetBrains Mono', monospace" }}>
                        {user.name !== user.id ? user.name : user.id}
                      </span>
                      {user.name !== user.id && (
                        <span style={{ fontSize: 10, color: colors.textMuted, marginLeft: 6 }}>{user.id}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: colors.textSecondary }}>{user.channels.length} channels</span>
                    {user.dangerousCount > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                        backgroundColor: '#dc262620', color: '#dc2626',
                      }}>{user.dangerousCount} dangerous</span>
                    )}
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '0 14px 10px', borderTop: `1px solid ${colors.border}` }}>
                      {user.channels.map((ch, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0',
                          borderBottom: i < user.channels.length - 1 ? `1px solid ${colors.border}` : 'none',
                        }}>
                          <Hash size={12} style={{ color: colors.textMuted, marginTop: 2, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: colors.text, fontFamily: "'JetBrains Mono', monospace" }}>{ch.channel.name}</div>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                              {ch.allow.map(p => <PermBadge key={`a-${p}`} perm={p} />)}
                              {ch.deny.map(p => (
                                <span key={`d-${p}`} style={{
                                  fontSize: 10, padding: '1px 6px', borderRadius: 3, fontFamily: "'JetBrains Mono', monospace",
                                  color: colors.textMuted, backgroundColor: colors.bgAlt, textDecoration: 'line-through',
                                }}>{p}</span>
                              ))}
                            </div>
                          </div>
                          {ch.dangerous.length > 0 && <AlertTriangle size={12} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      )}

      {/* Channel view */}
      {(viewMode === 'channels' || viewMode === 'dangerous') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filteredChannels.slice(0, 100).map(ch => (
            <Card key={ch.id} style={{ padding: '8px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Hash size={12} style={{ color: colors.textMuted }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.text, fontFamily: "'JetBrains Mono', monospace" }}>{ch.name}</span>
                <span style={{ fontSize: 10, color: colors.textMuted }}>{ch.type}</span>
                {ch.has_dangerous_overwrites && <AlertTriangle size={12} style={{ color: '#ea580c' }} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 20 }}>
                {(ch.permission_overwrites || [])
                  .filter(ow => permFilter === 'all' || (ow.dangerous_allows || []).includes(permFilter))
                  .map((ow, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                    <span style={{
                      fontSize: 9, padding: '0 4px', borderRadius: 3, fontWeight: 600,
                      backgroundColor: ow.target_type === 'member' ? (isDark ? '#7f1d1d' : '#fef2f2') : (isDark ? '#1e3a5f' : '#eff6ff'),
                      color: ow.target_type === 'member' ? '#dc2626' : '#2563eb',
                    }}>{ow.target_type}</span>
                    <span style={{ color: colors.text, fontFamily: "'JetBrains Mono', monospace" }}>
                      {ow.target_name || ow.target_id}
                    </span>
                    <span style={{ color: colors.textMuted }}>:</span>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {(ow.dangerous_allows || []).map(p => <PermBadge key={p} perm={p} />)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          {filteredChannels.length > 100 && (
            <div style={{ textAlign: 'center', padding: 12, color: colors.textMuted, fontSize: 12 }}>
              Showing 100 of {filteredChannels.length} channels
            </div>
          )}
        </div>
      )}

      {/* Stale overwrite view */}
      {viewMode === 'stale' && (() => {
        const stale = detectStaleOverwrites(dump.channels || [], dump.members || []);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              padding: '10px 14px', borderRadius: 6, fontSize: 12,
              backgroundColor: isDark ? '#7f1d1d20' : '#fef2f2', border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}`,
              color: isDark ? '#fca5a5' : '#991b1b',
            }}>
              {stale.length} channel overwrites target user IDs not found in the member list. These could be pre-staged access or orphaned overwrites.
            </div>
            {stale.map((s, i) => (
              <Card key={i} style={{ padding: '8px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Hash size={12} style={{ color: colors.textMuted }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: colors.text, fontFamily: "'JetBrains Mono', monospace" }}>{s.channel.name}</span>
                  {s.dangerous && <AlertTriangle size={12} style={{ color: '#dc2626' }} />}
                  <span style={{ fontSize: 10, color: colors.textMuted, marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>{s.userId}</span>
                </div>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4, paddingLeft: 20 }}>
                  {(s.overwrite.allow || []).map(p => <PermBadge key={`a-${p}`} perm={p} />)}
                </div>
              </Card>
            ))}
            {stale.length === 0 && <EmptyState icon={ShieldCheck} title="No stale overwrites" desc="All member overwrites target users in the cached member list." />}
          </div>
        );
      })()}
    </div>
  );
}

// ----------------------------------------------------------------------------
// VIEW: FINDINGS
// ----------------------------------------------------------------------------

function FindingsView({ dump }) {
  const { colors } = useTheme();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const issues = useMemo(() => dump.security_analysis?.issues || [], [dump]);
  const categories = useMemo(() => [...new Set(issues.map(i => i.category))].sort(), [issues]);

  const filtered = useMemo(() => {
    return issues.filter(issue => {
      if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
      if (searchTerm && !issue.finding.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [issues, severityFilter, categoryFilter, searchTerm]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <SearchInput value={searchTerm} onChange={v => { setSearchTerm(v); setPage(0); }} placeholder="Search findings..." style={{ width: 250 }} />
        <select value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setPage(0); }} style={{
          padding: '6px 8px', borderRadius: 5, fontSize: 12, border: `1px solid ${colors.border}`,
          backgroundColor: colors.inputBg, color: colors.text,
        }}>
          <option value="all">All severities</option>
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(0); }} style={{
          padding: '6px 8px', borderRadius: 5, fontSize: 12, border: `1px solid ${colors.border}`,
          backgroundColor: colors.inputBg, color: colors.text,
        }}>
          <option value="all">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 'auto' }}>{filtered.length} findings</span>
      </div>

      <Card style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {pageItems.map((issue, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 14px',
              borderBottom: i < pageItems.length - 1 ? `1px solid ${colors.border}` : 'none',
            }}>
              <SeverityBadge severity={issue.severity} />
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
                backgroundColor: colors.bgAlt, color: colors.textMuted, whiteSpace: 'nowrap',
              }}>{issue.category}</span>
              <span style={{ fontSize: 12, color: colors.text, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5, wordBreak: 'break-word' }}>
                {issue.finding}
              </span>
            </div>
          ))}
          {pageItems.length === 0 && (
            <EmptyState icon={ShieldCheck} title="No findings match" desc="Try adjusting your filters." />
          )}
        </div>
      </Card>

      {pageCount > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
            style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${colors.border}`, backgroundColor: colors.bgAlt, color: colors.text, cursor: 'pointer', opacity: page === 0 ? 0.3 : 1 }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: colors.textSecondary }}>Page {page + 1} of {pageCount}</span>
          <button onClick={() => setPage(Math.min(pageCount - 1, page + 1))} disabled={page >= pageCount - 1}
            style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${colors.border}`, backgroundColor: colors.bgAlt, color: colors.text, cursor: 'pointer', opacity: page >= pageCount - 1 ? 0.3 : 1 }}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// VIEW: MEMBERS
// ----------------------------------------------------------------------------

function MembersView({ dump }) {
  const { colors, isDark } = useTheme();
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('blast');

  const membersWithBlast = useMemo(() => {
    return (dump.members || []).map(m => ({
      member: m,
      blast: computeBlastRadius(m, dump.roles || [], dump.channels || []),
    }));
  }, [dump]);

  const sorted = useMemo(() => {
    let list = membersWithBlast;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(({ member }) =>
        member.username.toLowerCase().includes(term) ||
        member.display_name.toLowerCase().includes(term) ||
        member.id.includes(term)
      );
    }
    if (sortBy === 'blast') list = _.orderBy(list, [x => x.blast?.blastScore || 0], ['desc']);
    else if (sortBy === 'roles') list = _.orderBy(list, [x => x.member.roles.length], ['desc']);
    else if (sortBy === 'name') list = _.orderBy(list, [x => x.member.username], ['asc']);
    return list;
  }, [membersWithBlast, searchTerm, sortBy]);

  const detail = useMemo(() => {
    if (!selectedMember) return null;
    return computeBlastRadius(selectedMember, dump.roles || [], dump.channels || []);
  }, [selectedMember, dump]);

  return (
    <div style={{ display: 'flex', gap: 16, minHeight: 500 }}>
      {/* Member list */}
      <div style={{ width: selectedMember ? '35%' : '100%', display: 'flex', flexDirection: 'column', gap: 8, transition: 'width 0.2s' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search members..." style={{ flex: 1 }} />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            padding: '6px 8px', borderRadius: 5, fontSize: 12, border: `1px solid ${colors.border}`,
            backgroundColor: colors.inputBg, color: colors.text,
          }}>
            <option value="blast">Sort by threat</option>
            <option value="roles">Sort by roles</option>
            <option value="name">Sort by name</option>
          </select>
        </div>

        <div style={{
          padding: '6px 10px', borderRadius: 4, fontSize: 11, color: isDark ? '#93c5fd' : '#1d4ed8',
          backgroundColor: isDark ? '#1e3a5f20' : '#eff6ff',
        }}>
          {dump.members?.length || 0} members in dump. Member data may be incomplete.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'auto', maxHeight: 600 }}>
          {sorted.map(({ member, blast }) => {
            const isSelected = selectedMember?.id === member.id;
            const barColor = !blast ? '#16a34a' :
              blast.threatLevel === 'critical' ? '#dc2626' :
              blast.threatLevel === 'high' ? '#ea580c' :
              blast.threatLevel === 'medium' ? '#ca8a04' : '#16a34a';

            return (
              <div key={member.id} onClick={() => setSelectedMember(member)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderRadius: 6, cursor: 'pointer',
                  backgroundColor: isSelected ? colors.accentBg : colors.bgAlt,
                  border: `1px solid ${isSelected ? colors.accentBorder : 'transparent'}`,
                }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: `${barColor}15`, color: barColor, fontSize: 12, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {blast?.blastScore || 0}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {memberName(member)}
                    {member.bot && <Bot size={10} style={{ marginLeft: 4, color: colors.accent, verticalAlign: 'middle' }} />}
                  </div>
                  <div style={{ fontSize: 10, color: colors.textMuted }}>
                    {member.roles.length} roles
                    {member.is_admin && ' | ADMIN'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Member detail panel */}
      {selectedMember && detail && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.text, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {selectedMember.display_name}
                  {selectedMember.bot && <Bot size={14} style={{ marginLeft: 6, color: colors.accent, verticalAlign: 'middle' }} />}
                </h3>
                <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                  {selectedMember.username} | {selectedMember.id}
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} style={{
                border: 'none', background: 'none', cursor: 'pointer', color: colors.textMuted, padding: 4,
              }}><X size={16} /></button>
            </div>

            {/* Threat gauge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <div style={{
                width: 50, height: 50, borderRadius: 8, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: `${TIER_COLORS[detail.threatLevel].color}15`,
                border: `2px solid ${TIER_COLORS[detail.threatLevel].color}40`,
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: TIER_COLORS[detail.threatLevel].color, lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {detail.blastScore}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Blast Radius Score</div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>
                  {detail.isAdmin ? 'Full administrator access. Can do everything.' :
                    detail.blastScore >= 50 ? 'High damage potential if compromised.' :
                    detail.blastScore >= 20 ? 'Moderate capabilities. Some destructive actions possible.' :
                    'Limited permissions. Low risk.'}
                </div>
              </div>
            </div>
          </Card>

          {/* Roles */}
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
              Roles ({selectedMember.roles.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {selectedMember.roles
                .map(mr => (dump.roles || []).find(r => r.id === mr.id))
                .filter(Boolean)
                .sort((a, b) => b.position - a.position)
                .map(role => <RolePill key={role.id} role={role} small />)}
            </div>
          </Card>

          {/* Dangerous permissions */}
          {detail.dangerousPermissions.length > 0 && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
                Dangerous Permissions ({detail.dangerousPermissions.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {detail.dangerousPermissions.map(p => <PermBadge key={p} perm={p} />)}
              </div>
            </Card>
          )}

          {/* Assignable roles */}
          {detail.assignableRoles.length > 0 && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
                Can Assign ({detail.assignableRoles.length} roles)
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>
                Via MANAGE_ROLES. Non-managed roles below position {detail.maxRolePosition}.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 100, overflow: 'auto' }}>
                {detail.assignableRoles
                  .sort((a, b) => b.position - a.position)
                  .slice(0, 30)
                  .map(role => <RolePill key={role.id} role={role} small />)}
                {detail.assignableRoles.length > 30 && (
                  <span style={{ fontSize: 10, color: colors.textMuted, padding: '2px 6px' }}>
                    +{detail.assignableRoles.length - 30} more
                  </span>
                )}
              </div>
            </Card>
          )}

          {/* User overwrites */}
          {detail.userOverwrites.length > 0 && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
                User-Specific Overwrites ({detail.userOverwrites.length} channels)
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>
                These persist even if ALL roles are stripped from this user.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {detail.userOverwrites.map(({ channel, overwrite }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '3px 0' }}>
                    <Hash size={10} style={{ color: colors.textMuted }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: colors.text }}>{channel.name}</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {(overwrite.dangerous_allows || []).map(p => <PermBadge key={p} perm={p} />)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Blast radius network */}
          <BlastRadiusGraph member={selectedMember} roles={dump.roles || []} channels={dump.channels || []} />

          {/* Permission calculator */}
          <PermissionCalculator member={selectedMember} dump={dump} />

          {/* Threat summary */}
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
              Threat Summary
            </div>
            <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.7 }}>
              {detail.isAdmin && <div>Has ADMINISTRATOR. Can perform any action on the server.</div>}
              {detail.deletableChannels.length > 0 && (
                <div>Can permanently delete <strong style={{ color: '#dc2626' }}>{detail.deletableChannels.length}</strong> channels (irrecoverable).</div>
              )}
              {detail.webhookChannels.length > 0 && (
                <div>Can create impersonation webhooks on <strong style={{ color: '#ea580c' }}>{detail.webhookChannels.length}</strong> channels.</div>
              )}
              {detail.allPermissions.includes('BAN_MEMBERS') && <div>Can mass-ban members.</div>}
              {detail.allPermissions.includes('MODERATE_MEMBERS') && <div>Can mass-timeout members.</div>}
              {detail.allPermissions.includes('MANAGE_MESSAGES') && <div>Can purge message history.</div>}
              {detail.allPermissions.includes('MANAGE_GUILD_EXPRESSIONS') && <div>Can delete all custom emojis/stickers.</div>}
              {detail.assignableRoles.length > 0 && (
                <div>Can assign {detail.assignableRoles.length} roles to any member (lateral escalation via MANAGE_ROLES).</div>
              )}
              {detail.userOverwrites.length > 0 && (
                <div style={{ color: '#dc2626' }}>
                  Has {detail.userOverwrites.length} user-specific channel overwrites that survive role removal.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// VIEW: DIFF
// ----------------------------------------------------------------------------

function DiffView({ dumps }) {
  const { colors, isDark } = useTheme();
  const [dumpAId, setDumpAId] = useState(dumps[0]?.id || '');
  const [dumpBId, setDumpBId] = useState(dumps[1]?.id || '');

  const dumpA = dumps.find(d => d.id === dumpAId)?.data;
  const dumpB = dumps.find(d => d.id === dumpBId)?.data;

  const diff = useMemo(() => diffDumps(dumpA, dumpB), [dumpA, dumpB]);

  if (dumps.length < 2) {
    return <EmptyState icon={GitCompare} title="Need 2+ dumps to compare" desc="Upload multiple dump files to use the diff view. You can compare the same server at different times, or different servers." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <select value={dumpAId} onChange={e => setDumpAId(e.target.value)} style={{
          flex: 1, padding: '8px 10px', borderRadius: 6, fontSize: 12,
          border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text,
        }}>
          {dumps.map(d => <option key={d.id} value={d.id}>{d.label || d.data._meta?.guild_name}</option>)}
        </select>
        <ArrowRight size={16} style={{ color: colors.textMuted }} />
        <select value={dumpBId} onChange={e => setDumpBId(e.target.value)} style={{
          flex: 1, padding: '8px 10px', borderRadius: 6, fontSize: 12,
          border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text,
        }}>
          {dumps.map(d => <option key={d.id} value={d.id}>{d.label || d.data._meta?.guild_name}</option>)}
        </select>
      </div>

      {diff && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <StatCard label="Role Changes" value={diff.roles.added.length + diff.roles.removed.length + diff.roles.changed.length} icon={Shield} />
            <StatCard label="Channel Changes" value={diff.channels.added.length + diff.channels.removed.length} icon={Hash} />
            <StatCard label="New Findings" value={diff.issues.new.length} color={diff.issues.new.length > 0 ? '#dc2626' : undefined} icon={AlertTriangle} />
            <StatCard label="Resolved" value={diff.issues.resolved.length} color={diff.issues.resolved.length > 0 ? '#16a34a' : undefined} icon={ShieldCheck} />
          </div>

          {/* Role changes */}
          {(diff.roles.added.length > 0 || diff.roles.removed.length > 0 || diff.roles.changed.length > 0) && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>Role Changes</div>
              {diff.roles.added.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>+</span>
                  <RolePill role={r} small />
                  <span style={{ color: colors.textMuted }}>added at position {r.position}</span>
                </div>
              ))}
              {diff.roles.removed.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>-</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: colors.textMuted, textDecoration: 'line-through' }}>{r.name}</span>
                  <span style={{ color: colors.textMuted }}>removed (was position {r.position})</span>
                </div>
              ))}
              {diff.roles.changed.map(({ before, after }) => (
                <div key={after.id} style={{ padding: '4px 0', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#ca8a04', fontWeight: 600 }}>~</span>
                    <RolePill role={after} small />
                  </div>
                  {before.position !== after.position && (
                    <div style={{ paddingLeft: 20, color: colors.textMuted, fontSize: 11 }}>
                      Position: {before.position} → {after.position}
                    </div>
                  )}
                  {before.permissions_raw !== after.permissions_raw && (
                    <div style={{ paddingLeft: 20, color: '#ea580c', fontSize: 11 }}>
                      Permissions changed
                    </div>
                  )}
                </div>
              ))}
            </Card>
          )}

          {/* Channel changes */}
          {(diff.channels.added.length > 0 || diff.channels.removed.length > 0) && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>Channel Changes</div>
              {diff.channels.added.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12 }}>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>+</span>
                  <Hash size={10} style={{ color: colors.textMuted }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: colors.text }}>{c.name}</span>
                  <span style={{ color: colors.textMuted }}>{c.type}</span>
                </div>
              ))}
              {diff.channels.removed.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12 }}>
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>-</span>
                  <Hash size={10} style={{ color: colors.textMuted }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: colors.textMuted, textDecoration: 'line-through' }}>{c.name}</span>
                </div>
              ))}
            </Card>
          )}

          {/* New issues */}
          {diff.issues.new.length > 0 && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>
                New Findings ({diff.issues.new.length})
              </div>
              {diff.issues.new.map((issue, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', alignItems: 'flex-start' }}>
                  <SeverityBadge severity={issue.severity} />
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: colors.text }}>{issue.finding}</span>
                </div>
              ))}
            </Card>
          )}

          {/* Resolved issues */}
          {diff.issues.resolved.length > 0 && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>
                Resolved ({diff.issues.resolved.length})
              </div>
              {diff.issues.resolved.map((issue, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', alignItems: 'flex-start' }}>
                  <SeverityBadge severity={issue.severity} />
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: colors.textMuted, textDecoration: 'line-through' }}>{issue.finding}</span>
                </div>
              ))}
            </Card>
          )}

          {diff.summary.totalChanges === 0 && diff.issues.new.length === 0 && diff.issues.resolved.length === 0 && (
            <EmptyState icon={Check} title="No changes detected" desc="The two dumps are identical in terms of roles, channels, and security findings." />
          )}
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// VIEW: REPORT EXPORT
// ----------------------------------------------------------------------------

function ReportView({ dump }) {
  const { colors } = useTheme();

  const generateMarkdown = useCallback(() => {
    if (!dump) return '';
    const s = dump.summary || {};
    const sa = dump.security_analysis || {};
    const score = computeSecurityScore(dump);
    const remediation = generateRemediation(dump);
    const userOw = computeUserOverwriteAnalysis(dump.channels || []);
    const dangerousUsers = userOw.filter(u => u.dangerousCount > 0);

    let md = `# Security Audit Report: ${dump.guild?.name || 'Unknown'}\n\n`;
    md += `**Generated:** ${new Date().toISOString()}\n`;
    md += `**Dump timestamp:** ${dump._meta?.timestamp}\n`;
    md += `**Guild ID:** ${dump.guild?.id}\n`;
    md += `**Security Grade:** ${score.grade} (${score.score}/100)\n\n`;

    md += `## Summary\n\n`;
    md += `| Metric | Value |\n|---|---|\n`;
    md += `| Total Channels | ${s.total_channels} (${s.hidden_channels} hidden) |\n`;
    md += `| Total Roles | ${s.total_roles} (${s.managed_roles} managed) |\n`;
    md += `| Members | ${s.cached_members} (may be incomplete) |\n`;
    md += `| Admin Roles | ${s.admin_roles} |\n`;
    md += `| Dangerous Roles | ${s.dangerous_roles} |\n`;
    md += `| Security Findings | ${sa.total_issues} (${sa.critical} critical, ${sa.high} high) |\n\n`;

    md += `## Findings\n\n`;
    (sa.issues || []).forEach(issue => {
      md += `- **[${issue.severity}]** ${issue.finding}\n`;
    });

    if (dangerousUsers.length > 0) {
      md += `\n## User-Specific Overwrites (High Risk)\n\n`;
      md += `${dangerousUsers.length} users have dangerous permissions via individual channel overwrites.\n`;
      md += `These persist even after role removal.\n\n`;
      dangerousUsers.slice(0, 10).forEach(u => {
        md += `- **${u.name !== u.id ? u.name : u.id}**: ${u.dangerousCount} dangerous overwrites across ${u.channels.length} channels\n`;
      });
    }

    if (remediation.length > 0) {
      md += `\n## Remediation Recommendations\n\n`;
      remediation.forEach((r, i) => {
        md += `${i + 1}. **[${r.severity}]** ${r.action}\n`;
      });
    }

    // Threat vector results
    const threatResults = runThreatDetection(dump);
    const vulnerable = threatResults.filter(v => v.status === 'vulnerable');
    if (vulnerable.length > 0) {
      md += `\n## Active Threat Vectors (${vulnerable.length})\n\n`;
      vulnerable.forEach(v => {
        md += `- **[${v.impact?.toUpperCase()}]** ${v.name}: ${v.finding}\n`;
      });
    }

    md += `\n---\n*Generated by Discord Security Visualizer*\n`;
    return md;
  }, [dump]);

  const generateAdminDM = useCallback(() => {
    if (!dump) return '';
    const score = computeSecurityScore(dump);
    const threats = runThreatDetection(dump);
    const vulnerable = threats.filter(v => v.status === 'vulnerable');
    const s = dump.summary || {};

    let dm = `**Security Audit Summary for ${dump.guild?.name || 'your server'}**\n\n`;
    dm += `Security Grade: **${score.grade}** (${score.score}/100)\n`;
    dm += `${s.total_channels} channels | ${s.total_roles} roles | ${vulnerable.length} active risks found\n\n`;

    if (vulnerable.length > 0) {
      dm += `**Top Issues:**\n`;
      vulnerable.slice(0, 5).forEach(v => {
        dm += `- ${v.name}: ${v.finding}\n`;
      });
      if (vulnerable.length > 5) dm += `- ...and ${vulnerable.length - 5} more\n`;
    }

    dm += `\nFull report available from the security visualizer.`;
    return dm;
  }, [dump]);

  const [dmCopied, setDmCopied] = useState(false);

  const downloadReport = useCallback((format) => {
    const md = generateMarkdown();
    let content, filename, type;

    if (format === 'md') {
      content = md;
      filename = `security-report-${dump?.guild?.name?.replace(/[^a-z0-9]/gi, '_') || 'unknown'}-${new Date().toISOString().slice(0, 10)}.md`;
      type = 'text/markdown';
    } else {
      content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Security Report</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a2a;line-height:1.6}
h1{border-bottom:2px solid #e2e4e9;padding-bottom:8px}h2{color:#4338ca;margin-top:32px}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #e2e4e9;padding:8px 12px;text-align:left}
th{background:#f8f9fb}code{background:#f3f4f6;padding:2px 4px;border-radius:3px;font-size:0.9em}
strong{color:#1a1a2a}</style></head><body>${md.replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^\| (.+) \|$/gm, (m) => '<tr>' + m.split('|').filter(Boolean).map(c => `<td>${c.trim()}</td>`).join('') + '</tr>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/\n/g, '<br>')
      }</body></html>`;
      filename = `security-report-${dump?.guild?.name?.replace(/[^a-z0-9]/gi, '_') || 'unknown'}-${new Date().toISOString().slice(0, 10)}.html`;
      type = 'text/html';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [dump, generateMarkdown]);

  const [preview, setPreview] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: colors.text, fontFamily: "'Space Grotesk', sans-serif" }}>
          Export Security Report
        </h3>
        <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
          Generate a comprehensive security audit report from the current dump. Suitable for presenting to a server admin or archiving.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => downloadReport('md')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 6, border: `1px solid ${colors.border}`,
            backgroundColor: colors.bgAlt, color: colors.text, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: "'Space Grotesk', sans-serif",
          }}>
            <Download size={14} /> Download Markdown
          </button>
          <button onClick={() => downloadReport('html')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 6, border: 'none',
            backgroundColor: colors.accent, color: '#fff', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: "'Space Grotesk', sans-serif",
          }}>
            <Download size={14} /> Download HTML
          </button>
          <button onClick={() => setPreview(!preview)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 6, border: `1px solid ${colors.border}`,
            backgroundColor: preview ? colors.accentBg : colors.bgAlt,
            color: preview ? colors.accent : colors.text, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: "'Space Grotesk', sans-serif",
          }}>
            <Eye size={14} /> {preview ? 'Hide' : 'Preview'}
          </button>
          <button onClick={() => {
            const json = JSON.stringify({ guild: dump.guild, summary: dump.summary, securityScore: computeSecurityScore(dump), threats: runThreatDetection(dump), remediation: generateRemediation(dump) }, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `analysis-${dump.guild?.name?.replace(/[^a-z0-9]/gi, '_') || 'report'}.json`; a.click(); URL.revokeObjectURL(url);
          }} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 6, border: `1px solid ${colors.border}`,
            backgroundColor: colors.bgAlt, color: colors.text, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: "'Space Grotesk', sans-serif",
          }}>
            <Download size={14} /> JSON Analysis
          </button>
          <button onClick={() => {
            navigator.clipboard.writeText(generateAdminDM()).then(() => { setDmCopied(true); setTimeout(() => setDmCopied(false), 2000); });
          }} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 6, border: `1px solid ${dmCopied ? '#16a34a' : colors.border}`,
            backgroundColor: dmCopied ? '#f0fdf4' : colors.bgAlt, color: dmCopied ? '#16a34a' : colors.text, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: "'Space Grotesk', sans-serif",
          }}>
            <Copy size={14} /> {dmCopied ? 'Copied!' : 'Admin DM'}
          </button>
        </div>
      </Card>

      {preview && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <pre style={{
            margin: 0, padding: 20, overflow: 'auto', maxHeight: 600,
            backgroundColor: colors.codeBg, color: colors.text,
            fontSize: 12, lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: 'pre-wrap',
          }}>
            {generateMarkdown()}
          </pre>
        </Card>
      )}

      {/* Remediation suggestions */}
      <Card style={{ padding: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: colors.text, fontFamily: "'Space Grotesk', sans-serif" }}>
          Remediation Suggestions
        </h3>
        {generateRemediation(dump).map((r, i) => (
          <div key={i} style={{
            display: 'flex', gap: 8, padding: '8px 0',
            borderBottom: `1px solid ${colors.border}`,
          }}>
            <SeverityBadge severity={r.severity} />
            <span style={{ fontSize: 12, color: colors.text, lineHeight: 1.5 }}>{r.action}</span>
          </div>
        ))}
        {generateRemediation(dump).length === 0 && (
          <div style={{ fontSize: 12, color: colors.textMuted }}>No specific remediation suggestions for this dump.</div>
        )}
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------
// HIDDEN CHANNELS VIEW (bonus)
// ----------------------------------------------------------------------------

function HiddenChannelsInfo({ dump }) {
  const { colors, isDark } = useTheme();
  const hidden = dump.hidden_channels || [];
  if (hidden.length === 0) return null;

  return (
    <Card style={{ padding: 16, marginTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
        Hidden Channel Information Leakage
      </div>
      <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>
        {hidden.length} channels are "hidden" (VIEW_CHANNEL denied for @everyone), but their names, topics, and full permission structures are still accessible.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 150, overflow: 'auto' }}>
        {hidden.map(ch => (
          <span key={ch.id} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
            borderRadius: 4, fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
            backgroundColor: isDark ? '#1e3a5f20' : '#eff6ff', color: isDark ? '#93c5fd' : '#1d4ed8',
            border: `1px solid ${isDark ? '#1e3a5f' : '#bfdbfe'}`,
          }}>
            <Lock size={9} />
            {ch.name}
          </span>
        ))}
      </div>
    </Card>
  );
}

// ----------------------------------------------------------------------------
// ANALYSIS: THREAT DETECTION ENGINE
// ----------------------------------------------------------------------------

const THREAT_CATEGORIES = [
  'Webhook Abuse', 'AutoMod Bypass', 'Selfbot/Userbot Attacks',
  'Permission Overwrite Persistence', 'Audit Log Blind Spots',
  'Community Feature Abuse', 'Mass Reporting Weaponization',
  'Token & Session Manipulation', 'Cross-Server Vectors',
  'Rate Limit Exploitation', 'Invisible Nuke / Slow Burn',
  'Client Internals & Reconnaissance'
];

const THREAT_VECTORS = [
  // Cat 1: Webhook Abuse
  { id: 'WH-1', name: 'Webhook AutoMod Bypass', cat: 0, impact: 'severe', access: 'webhook URL', detect: d => { const r = (d.roles||[]).filter(x=>x.permissions_decoded?.MANAGE_WEBHOOKS); return r.length > 0 ? { status: 'partial', conf: 60, finding: `${r.length} roles can create webhooks. Webhook messages bypass ALL AutoMod rules.` } : { status: 'safe', conf: 80, finding: 'No roles have MANAGE_WEBHOOKS.' }; } },
  { id: 'WH-2', name: 'Webhook @everyone Ping', cat: 0, impact: 'severe', access: 'webhook URL', detect: d => { const r = (d.roles||[]).filter(x=>x.permissions_decoded?.MANAGE_WEBHOOKS); return r.length > 0 ? { status: 'partial', conf: 50, finding: `Webhooks can ping @everyone without permission. ${r.length} roles can create webhooks.` } : { status: 'safe', conf: 70, finding: 'No webhook creation capability detected.' }; } },
  { id: 'WH-3', name: 'Orphaned Webhook Backdoor', cat: 0, impact: 'destruction', access: 'one-time MANAGE_WEBHOOKS', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Cannot detect actual webhooks from current data. Needs webhook inventory API call.' }) },
  { id: 'WH-4', name: 'Webhook Token Enumeration', cat: 0, impact: 'destruction', access: 'MANAGE_WEBHOOKS', detect: d => { const r = (d.roles||[]).filter(x=>x.permissions_decoded?.MANAGE_WEBHOOKS); const m = (d.members||[]).filter(mem => mem.roles.some(mr => r.some(rr => rr.id === mr.id))); return { status: r.length > 0 ? 'vulnerable' : 'safe', conf: 75, finding: r.length > 0 ? `${m.length} users can enumerate ALL webhook tokens server-wide via ${r.length} roles with MANAGE_WEBHOOKS.` : 'No MANAGE_WEBHOOKS holders.' }; } },
  { id: 'WH-5', name: 'Webhook Bait-and-Switch Edit', cat: 0, impact: 'severe', access: 'webhook URL', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Webhook message editing cannot be detected from server structure data.' }) },
  { id: 'WH-6', name: 'Webhook Phishing via Embeds', cat: 0, impact: 'severe', access: 'webhook URL', detect: () => ({ status: 'partial', conf: 30, finding: 'Any channel with webhook access is vulnerable to phishing embeds. Cannot detect existing webhooks.' }) },
  { id: 'WH-7', name: 'Webhook Independent Rate Limits', cat: 0, impact: 'moderate', access: 'webhook URL', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Rate limit exploitation requires active webhook monitoring.' }) },
  // Cat 2: AutoMod Bypass
  { id: 'AM-1', name: 'Unicode Homoglyph Filter Bypass', cat: 1, impact: 'moderate', access: 'any user', detect: () => ({ status: 'partial', conf: 40, finding: 'Cyrillic characters bypass keyword filters. Cannot check AutoMod rules from current data.' }) },
  { id: 'AM-2', name: 'Zero-Width Character Insertion', cat: 1, impact: 'moderate', access: 'any user', detect: () => ({ status: 'partial', conf: 40, finding: 'Invisible characters split filtered words. AutoMod does not strip them.' }) },
  { id: 'AM-3', name: 'Percent-Encoding URL Bypass', cat: 1, impact: 'moderate', access: 'any user', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Confirmed bug. Cannot detect without AutoMod rule data.' }) },
  { id: 'AM-4', name: 'Allowlist Regex Interaction Bug', cat: 1, impact: 'severe', access: 'any user', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Confirmed bug where allowlist words disable regex for rest of message.' }) },
  { id: 'AM-5', name: 'Markdown Masked Link Phishing', cat: 1, impact: 'severe', access: 'any user', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Bold/italic in masked links bypasses phishing detection. Not fully patched.' }) },
  { id: 'AM-6', name: 'Admin/ManageServer AutoMod Exempt', cat: 1, impact: 'moderate', access: 'admin', detect: d => { const exempt = (d.roles||[]).filter(r => r.permissions_decoded?.ADMINISTRATOR || r.permissions_decoded?.MANAGE_MESSAGES); return { status: exempt.length > 3 ? 'vulnerable' : 'safe', conf: 90, finding: `${exempt.length} roles are exempt from AutoMod (ADMINISTRATOR or MANAGE_MESSAGES).` }; } },
  { id: 'AM-7', name: 'AutoMod Structural Limitations', cat: 1, impact: 'moderate', access: 'any user', detect: d => { const hasCommunity = (d.guild?.features||[]).includes('COMMUNITY'); return { status: 'partial', conf: 50, finding: `AutoMod limited to 6 keyword rules, 1000 keywords each. ${hasCommunity ? 'Community features enabled.' : 'Community features NOT enabled.'}` }; } },
  // Cat 3: Selfbot/Userbot
  { id: 'SB-1', name: 'Message Scraping (Zero Detection)', cat: 2, impact: 'severe', access: 'any user', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Message scraping at 6000 msg/min is undetectable from server structure.' }) },
  { id: 'SB-2', name: 'Presence Monitoring', cat: 2, impact: 'moderate', access: 'any user', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Passive presence monitoring via gateway is undetectable.' }) },
  { id: 'SB-3', name: 'Thread Creation Spam', cat: 2, impact: 'moderate', access: 'any user', detect: d => { const ev = (d.roles||[]).find(r => r.name === '@everyone'); const canThread = ev?.permissions_decoded?.CREATE_PUBLIC_THREADS; return { status: canThread ? 'vulnerable' : 'safe', conf: 85, finding: canThread ? '@everyone can create public threads. Common spam vector.' : 'Thread creation restricted from @everyone.' }; } },
  { id: 'SB-4', name: 'Reaction Bombing', cat: 2, impact: 'nuisance', access: 'any user', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Reaction abuse not detectable from server structure.' }) },
  { id: 'SB-5', name: 'Voice Channel Disruption', cat: 2, impact: 'moderate', access: 'any user', detect: () => ({ status: 'partial', conf: 30, finding: 'Voice disruption via rapid join/leave has no built-in cooldown.' }) },
  { id: 'SB-6', name: 'Soundboard Abuse', cat: 2, impact: 'nuisance', access: 'any user', detect: d => { const ev = (d.roles||[]).find(r => r.name === '@everyone'); const can = ev?.permissions_decoded?.USE_SOUNDBOARD; return { status: can ? 'vulnerable' : 'safe', conf: 80, finding: can ? 'Soundboard enabled for @everyone with no admin-configurable cooldown.' : 'Soundboard restricted.' }; } },
  { id: 'SB-7', name: 'Slowmode Bypass via Edits', cat: 2, impact: 'nuisance', access: 'any user', detect: () => ({ status: 'partial', conf: 50, finding: 'Slowmode only restricts new messages, not edits to existing ones.' }) },
  { id: 'SB-8', name: 'DM Spam from Server', cat: 2, impact: 'moderate', access: 'any user', detect: () => ({ status: 'undetectable', conf: 0, finding: 'DM spam from server members is not detectable from structure.' }) },
  // Cat 4: Permission Overwrite Persistence
  { id: 'PO-1', name: 'Pre-Staged User Overwrites', cat: 3, impact: 'destruction', access: 'MANAGE_ROLES', detect: d => { const memberIds = new Set((d.members||[]).map(m => m.id)); let staged = 0; (d.channels||[]).forEach(ch => { (ch.permission_overwrites||[]).forEach(ow => { if (ow.target_type === 'member' && !memberIds.has(ow.target_id)) staged++; }); }); return { status: staged > 0 ? 'vulnerable' : 'safe', conf: 60, finding: staged > 0 ? `${staged} channel overwrites target user IDs not in the cached member list. Possible pre-staged access or orphaned overwrites.` : 'No overwrites targeting unknown users detected.' }; } },
  { id: 'PO-2', name: 'Hidden Channel Infrastructure', cat: 3, impact: 'severe', access: 'MANAGE_CHANNELS', detect: d => { const hidden = (d.hidden_channels||[]).length; return { status: hidden > 20 ? 'vulnerable' : hidden > 0 ? 'partial' : 'safe', conf: 85, finding: `${hidden} hidden channels. Names, topics, and permission structures are accessible regardless of VIEW_CHANNEL denies.` }; } },
  { id: 'PO-3', name: 'Allow-Beats-Deny Confusion', cat: 3, impact: 'moderate', access: 'MANAGE_ROLES', detect: d => { let conflicts = 0; (d.channels||[]).forEach(ch => { const ows = ch.permission_overwrites||[]; const denies = new Set(); const allows = new Set(); ows.filter(o => o.target_type === 'role').forEach(o => { (o.deny||[]).forEach(p => denies.add(p)); (o.allow||[]).forEach(p => allows.add(p)); }); denies.forEach(p => { if (allows.has(p)) conflicts++; }); }); return { status: conflicts > 5 ? 'vulnerable' : conflicts > 0 ? 'partial' : 'safe', conf: 70, finding: conflicts > 0 ? `${conflicts} channels have conflicting role overwrites where allows override denies. Mute/restrict roles may be ineffective.` : 'No conflicting overwrites detected.' }; } },
  { id: 'PO-4', name: 'Admin Lockout via Deny Overwrites', cat: 3, impact: 'moderate', access: 'MANAGE_ROLES', detect: d => { const staffRoles = (d.roles||[]).filter(r => r.is_dangerous && !r.managed); let lockouts = 0; (d.channels||[]).forEach(ch => { (ch.permission_overwrites||[]).forEach(ow => { if (ow.target_type === 'role' && staffRoles.some(r => r.id === ow.target_id) && (ow.deny||[]).some(p => ['VIEW_CHANNEL','SEND_MESSAGES','MANAGE_CHANNELS'].includes(p))) lockouts++; }); }); return { status: lockouts > 0 ? 'vulnerable' : 'safe', conf: 80, finding: lockouts > 0 ? `${lockouts} channels have deny overwrites targeting staff roles. Potential moderator lockout.` : 'No staff lockout overwrites detected.' }; } },
  { id: 'PO-5', name: 'User-Specific Overwrite Persistence', cat: 3, impact: 'severe', access: 'MANAGE_ROLES', detect: d => { let userOws = 0; (d.channels||[]).forEach(ch => { (ch.permission_overwrites||[]).forEach(ow => { if (ow.target_type === 'member' && (ow.dangerous_allows||[]).length > 0) userOws++; }); }); return { status: userOws > 10 ? 'vulnerable' : userOws > 0 ? 'partial' : 'safe', conf: 90, finding: `${userOws} dangerous user-specific overwrites. These survive role removal.` }; } },
  // Cat 5: Audit Log Blind Spots
  { id: 'AL-1', name: 'Self-Message Deletion Unlogged', cat: 4, impact: 'moderate', access: 'any user', detect: () => ({ status: 'partial', conf: 90, finding: 'Users deleting their own messages generates no audit entry. By design.' }) },
  { id: 'AL-2', name: 'Bot Message Deletion Unlogged', cat: 4, impact: 'moderate', access: 'bot', detect: () => ({ status: 'partial', conf: 90, finding: 'Bots deleting messages create no audit entry. Only human moderator deletions are logged.' }) },
  { id: 'AL-3', name: 'Template Exfiltration Unlogged', cat: 4, impact: 'severe', access: 'MANAGE_GUILD', detect: d => { const r = (d.roles||[]).filter(x=>x.permissions_decoded?.MANAGE_GUILD&&!x.has_admin); const m = (d.members||[]).filter(mem => mem.roles.some(mr => r.some(rr => rr.id === mr.id))); return { status: r.length > 0 ? 'vulnerable' : 'safe', conf: 85, finding: r.length > 0 ? `${m.length} users can exfiltrate the entire server structure via templates with ZERO audit log evidence.` : 'No non-admin MANAGE_GUILD holders.' }; } },
  { id: 'AL-4', name: 'Cross-Post No Audit Trail', cat: 4, impact: 'severe', access: 'announcement channel', detect: () => ({ status: 'partial', conf: 70, finding: 'Cross-posting to announcement channels has no audit event. Malicious content can spread to following servers silently.' }) },
  { id: 'AL-5', name: 'Webhook Message No Logging', cat: 4, impact: 'severe', access: 'webhook URL', detect: () => ({ status: 'partial', conf: 80, finding: 'Webhook messages are sent with zero audit logging once the URL exists.' }) },
  { id: 'AL-6', name: 'Message Editing No Audit', cat: 4, impact: 'moderate', access: 'any user', detect: () => ({ status: 'partial', conf: 90, finding: 'Message content changes leave no audit entry.' }) },
  { id: 'AL-7', name: 'Audit Log Flooding', cat: 4, impact: 'moderate', access: 'MANAGE_ROLES', detect: () => ({ status: 'partial', conf: 60, finding: 'Rapid create/delete operations push suspicious entries beyond practical viewing window.' }) },
  { id: 'AL-8', name: '45-Day Audit Expiration', cat: 4, impact: 'severe', access: 'any insider', detect: () => ({ status: 'partial', conf: 95, finding: 'All audit entries expire after 45 days. Changes beyond this window are forensically invisible.' }) },
  { id: 'AL-9', name: 'Webhook Delete Null User ID', cat: 4, impact: 'moderate', access: 'webhook token', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Webhook self-deletion shows user_id: null in audit log.' }) },
  // Cat 6: Community Feature Abuse
  { id: 'CF-1', name: 'Community Mode Kill Switch', cat: 5, impact: 'destruction', access: 'MANAGE_GUILD', detect: d => { const hasCommunity = (d.guild?.features||[]).includes('COMMUNITY'); const mgRoles = (d.roles||[]).filter(r=>r.permissions_decoded?.MANAGE_GUILD&&!r.has_admin); if (!hasCommunity) return { status: 'safe', conf: 90, finding: 'Community mode not enabled.' }; return { status: 'vulnerable', conf: 85, finding: `Community mode enabled. ${mgRoles.length} non-admin roles with MANAGE_GUILD can disable it in one action, destroying Discovery, Welcome Screen, Announcement/Stage Channels, Onboarding, Forum configs.` }; } },
  { id: 'CF-2', name: 'Onboarding Bypass (Old Clients)', cat: 5, impact: 'moderate', access: 'any user', detect: () => ({ status: 'partial', conf: 50, finding: 'Users on older Discord versions can bypass onboarding entirely.' }) },
  { id: 'CF-3', name: 'OAuth2 Screening Bypass', cat: 5, impact: 'moderate', access: 'OAuth2 app', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Members joining via OAuth2 bypass membership screening.' }) },
  { id: 'CF-4', name: 'Server Insights Data Exposure', cat: 5, impact: 'moderate', access: 'VIEW_SERVER_INSIGHTS', detect: () => ({ status: 'partial', conf: 50, finding: 'Server Insights expose 120 days of analytics. Accessing Insights is not logged.' }) },
  { id: 'CF-5', name: 'Vanity URL Sniping', cat: 5, impact: 'severe', access: 'no perms', detect: d => { const vanity = d.guild?.vanity_url_code; return { status: vanity ? 'partial' : 'safe', conf: 60, finding: vanity ? `Server has vanity URL "/${vanity}". If boost level drops, URL becomes snipeable for phishing redirects.` : 'No vanity URL configured.' }; } },
  // Cat 7: Mass Reporting
  { id: 'MR-1', name: 'Coordinated Mass Reporting', cat: 6, impact: 'severe', access: 'multiple accounts', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Mass reporting attacks cannot be detected from server structure.' }) },
  { id: 'MR-2', name: 'Discovery Delisting via Reports', cat: 6, impact: 'severe', access: 'external', detect: d => { const disc = (d.guild?.features||[]).includes('DISCOVERABLE'); return disc ? { status: 'partial', conf: 50, finding: 'Server is in Discovery. Vulnerable to coordinated report campaigns triggering delisting.' } : { status: 'safe', conf: 80, finding: 'Not in Discovery.' }; } },
  { id: 'MR-3', name: 'False DMCA Takedown', cat: 6, impact: 'severe', access: 'external', detect: () => ({ status: 'undetectable', conf: 0, finding: 'DMCA attacks are external to server structure.' }) },
  { id: 'MR-4', name: 'Selfbot Mass Report Coordination', cat: 6, impact: 'severe', access: 'multiple accounts', detect: d => { const disc = (d.guild?.features||[]).includes('DISCOVERABLE'); return { status: disc ? 'partial' : 'safe', conf: 40, finding: disc ? 'Server in Discovery. Multiple selfbot accounts can coordinate reports to trigger Osprey automated enforcement.' : 'Not in Discovery. Mass reporting less impactful.' }; } },
  { id: 'MR-5', name: 'Content Planting + Report', cat: 6, impact: 'severe', access: 'selfbot + reporter accounts', detect: d => { const ev = (d.roles||[]).find(r=>r.name==='@everyone'); const canPost = ev?.permissions_decoded?.SEND_MESSAGES; return { status: canPost ? 'partial' : 'safe', conf: 30, finding: canPost ? 'Any member can post. Attackers can plant rule-violating content then report it from separate accounts.' : 'Posting restricted.' }; } },
  // Cat 8: Token & Session
  { id: 'TS-1', name: 'QR Code Login 2FA Bypass', cat: 7, impact: 'destruction', access: 'social engineering', detect: () => ({ status: 'undetectable', conf: 0, finding: 'QR phishing is a client-side attack vector.' }) },
  { id: 'TS-2', name: 'Token Never Expires', cat: 7, impact: 'destruction', access: 'stolen token', detect: () => ({ status: 'partial', conf: 80, finding: 'Discord tokens never expire while in use. Only password change invalidates.' }) },
  { id: 'TS-3', name: 'X-Super-Properties Manipulation', cat: 7, impact: 'moderate', access: 'client modification', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Client metadata manipulation not detectable from server data.' }) },
  { id: 'TS-4', name: 'Experiment Hash Gaming', cat: 7, impact: 'moderate', access: 'technical knowledge', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Experiment manipulation requires client-side observation.' }) },
  { id: 'TS-5', name: 'Race Condition in Permission Updates', cat: 7, impact: 'moderate', access: 'MANAGE_ROLES', detect: () => ({ status: 'partial', conf: 40, finding: 'Confirmed race condition in rapid permission changes. Requests return 200 but changes may not apply.' }) },
  // Cat 9: Cross-Server
  { id: 'CS-1', name: 'CDN Malware Hosting', cat: 8, impact: 'severe', access: 'any user', detect: () => ({ status: 'undetectable', conf: 0, finding: 'CDN abuse is external to server structure.' }) },
  { id: 'CS-2', name: 'Social Graph via Mutual Servers', cat: 8, impact: 'moderate', access: 'any user', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Social graph mapping is user-side, not server-side.' }) },
  { id: 'CS-3', name: 'Connected Account Deanonymization', cat: 8, impact: 'moderate', access: 'any user', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Connected account exposure is user-side.' }) },
  // Cat 10: Rate Limit Exploitation
  { id: 'RL-1', name: 'Nuke Speed: Mass Ban', cat: 9, impact: 'destruction', access: 'BAN_MEMBERS', detect: d => { const bans = (d.roles||[]).filter(r=>r.permissions_decoded?.BAN_MEMBERS); const mc = d.members?.length||0; if (bans.length===0) return { status: 'safe', conf: 80, finding: 'No BAN_MEMBERS holders.' }; const mins = Math.ceil(mc / 60); return { status: 'vulnerable', conf: 85, finding: `${bans.length} roles can ban. ${mc} cached members could be banned in ~${mins} minutes (60 bans/min rate limit).` }; } },
  { id: 'RL-2', name: 'Nuke Speed: Channel Deletion', cat: 9, impact: 'destruction', access: 'MANAGE_CHANNELS', detect: d => { const ch = (d.channels||[]).filter(c=>c.type!=='CATEGORY').length; const r = (d.roles||[]).filter(x=>x.permissions_decoded?.MANAGE_CHANNELS||x.has_admin); if (r.length===0) return { status: 'safe', conf: 80, finding: 'No MANAGE_CHANNELS holders.' }; const mins = (ch/60).toFixed(1); return { status: 'vulnerable', conf: 85, finding: `${ch} channels deletable in ~${mins} minutes (60 deletes/min). ${r.length} roles have this capability.` }; } },
  { id: 'RL-3', name: 'Nuke Speed: Emoji Wipe', cat: 9, impact: 'moderate', access: 'MANAGE_GUILD_EXPRESSIONS', detect: d => { const r = (d.roles||[]).filter(x=>x.permissions_decoded?.MANAGE_GUILD_EXPRESSIONS); return { status: r.length > 0 ? 'partial' : 'safe', conf: 60, finding: r.length > 0 ? `${r.length} roles can delete all custom emojis/stickers.` : 'No expression management roles.' }; } },
  { id: 'RL-4', name: 'Concurrent Destruction via Multiple Accounts', cat: 9, impact: 'destruction', access: 'multiple compromised accounts', detect: () => ({ status: 'partial', conf: 40, finding: 'Multiple compromised accounts multiply destruction speed. Rate limits are per-account.' }) },
  // Cat 11: Invisible Nuke / Slow Burn
  { id: 'IN-1', name: 'Permission Drift Beyond 45 Days', cat: 10, impact: 'severe', access: 'insider', detect: () => ({ status: 'partial', conf: 70, finding: 'Gradual permission changes beyond 45 days become forensically invisible. Use diff mode with periodic dumps.' }) },
  { id: 'IN-2', name: 'Sleeper Alt Account Escalation', cat: 10, impact: 'severe', access: 'multiple accounts', detect: d => { const recent = (d.members||[]).filter(m => { const age = m.joined_at ? (Date.now() - new Date(m.joined_at).getTime()) / 86400000 : 999; return m.is_admin && age < 30; }); return { status: recent.length > 0 ? 'partial' : 'safe', conf: 40, finding: recent.length > 0 ? `${recent.length} admin members joined within 30 days. Check for rapid role escalation.` : 'No recently-joined admins.' }; } },
  { id: 'IN-3', name: 'Ghost Webhook Trust Building', cat: 10, impact: 'severe', access: 'webhook URL', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Webhook trust exploitation requires message content analysis.' }) },
  { id: 'IN-4', name: 'AutoMod Gradual Weakening', cat: 10, impact: 'moderate', access: 'MANAGE_GUILD', detect: () => ({ status: 'undetectable', conf: 0, finding: 'AutoMod rule changes need AutoModRuleStore data.' }) },
  // Cat 12: Client Internals
  { id: 'CI-1', name: 'Hidden Channel Information Leakage', cat: 11, impact: 'moderate', access: 'any member', detect: d => { const h = (d.hidden_channels||[]).length; return { status: h > 0 ? 'vulnerable' : 'safe', conf: 95, finding: h > 0 ? `${h} hidden channel names, topics, and permission structures are accessible to any connected member.` : 'No hidden channels.' }; } },
  { id: 'CI-2', name: 'Widget Public Data Exposure', cat: 11, impact: 'moderate', access: 'no auth', detect: d => ({ status: 'partial', conf: 30, finding: `Widget status unknown. Check: discord.com/api/guilds/${d.guild?.id}/widget.json (public, no auth needed).` }) },
  { id: 'CI-3', name: 'ML Demographics Prediction', cat: 11, impact: 'moderate', access: 'Discord internal', detect: () => ({ status: 'undetectable', conf: 0, finding: 'ML predictions stored in analytics events, not accessible from server data.' }) },
  { id: 'CI-4', name: 'Embed Domain Spoofing', cat: 11, impact: 'severe', access: 'any user', detect: () => ({ status: 'undetectable', conf: 0, finding: 'URL parsing difference exploit. Not detectable from server structure.' }) },
  { id: 'CI-5', name: 'Bot Token Exposure', cat: 11, impact: 'destruction', access: 'external', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Token leaks on external platforms not detectable from server data.' }) },
  // Additional detections from instructions
  { id: 'SV-1', name: 'MFA Not Required for Moderation', cat: 5, impact: 'severe', access: 'compromised account', detect: d => ({ status: d.guild?.mfa_level === 0 ? 'vulnerable' : 'safe', conf: 95, finding: d.guild?.mfa_level === 0 ? 'Server does not require 2FA for moderation. Any compromised moderator without 2FA allows immediate destructive actions.' : '2FA required for moderation actions.' }) },
  { id: 'SV-2', name: 'Server Discovery Exposure', cat: 5, impact: 'moderate', access: 'external', detect: d => { const disc = (d.guild?.features||[]).includes('DISCOVERABLE'); return { status: disc ? 'partial' : 'safe', conf: 70, finding: disc ? 'Server listed in Discovery. Content violations or mass reports could trigger automatic delisting.' : 'Not in Discovery.' }; } },
  { id: 'SV-3', name: 'Mention @everyone Abuse Surface', cat: 2, impact: 'moderate', access: 'specific role', detect: d => { const r = (d.roles||[]).filter(x=>x.permissions_decoded?.MENTION_EVERYONE&&x.name!=='@everyone'); return { status: r.length > 2 ? 'vulnerable' : r.length > 0 ? 'partial' : 'safe', conf: 85, finding: `${r.length} roles can @everyone. ${r.map(x=>x.name).join(', ')}` }; } },
  { id: 'SV-4', name: 'Kick/Prune Mass Removal', cat: 9, impact: 'severe', access: 'KICK_MEMBERS', detect: d => { const r = (d.roles||[]).filter(x=>x.permissions_decoded?.KICK_MEMBERS); return { status: r.length > 0 ? 'partial' : 'safe', conf: 70, finding: r.length > 0 ? `${r.length} roles have KICK_MEMBERS. Prune feature enables mass-kicking all inactive members.` : 'No KICK_MEMBERS holders.' }; } },
  { id: 'SV-5', name: 'Webhook Channel Overwrite Exposure', cat: 0, impact: 'severe', access: 'MANAGE_ROLES', detect: d => { let whOws = 0; (d.channels||[]).forEach(ch => { (ch.permission_overwrites||[]).forEach(ow => { if ((ow.dangerous_allows||[]).includes('MANAGE_WEBHOOKS')) whOws++; }); }); return { status: whOws > 0 ? 'vulnerable' : 'safe', conf: 80, finding: whOws > 0 ? `${whOws} channel-level MANAGE_WEBHOOKS overwrites. Each is a potential persistent backdoor vector.` : 'No channel-level webhook overwrites.' }; } },
  { id: 'SV-6', name: 'Opcode 29 Remote Command', cat: 7, impact: 'moderate', access: 'authenticated user', detect: () => ({ status: 'undetectable', conf: 0, finding: 'Gateway opcode exploitation not detectable from server structure.' }) },
  { id: 'SV-7', name: 'Opcode 14 Member Scraping', cat: 11, impact: 'moderate', access: 'any user', detect: () => ({ status: 'partial', conf: 50, finding: 'Member list scraping via gateway subscriptions is undetectable but affects all servers.' }) },
  { id: 'SV-8', name: 'Stage Channel Public Exposure', cat: 5, impact: 'moderate', access: 'stage access', detect: d => { const stages = (d.channels||[]).filter(c=>c.type==='STAGE'); return { status: stages.length > 0 ? 'partial' : 'safe', conf: 60, finding: stages.length > 0 ? `${stages.length} stage channels. Public stages temporarily make the server joinable by anyone.` : 'No stage channels.' }; } },
];

function runThreatDetection(dump) {
  return THREAT_VECTORS.map(v => {
    const result = v.detect(dump);
    return { ...v, ...result, category: THREAT_CATEGORIES[v.cat] };
  });
}

function computeNukeTimeline(member, roles, channels, allMembers) {
  const blast = computeBlastRadius(member, roles, channels);
  if (!blast) return { timeline: [], totalMinutes: 0, blastScore: 0 };
  const timeline = [];
  let t = 0;
  const mc = allMembers?.length || 0;
  const cc = channels.filter(c => c.type !== 'CATEGORY').length;
  const hasPerm = (p) => blast.isAdmin || blast.allPermissions.includes(p);

  if (hasPerm('BAN_MEMBERS') && mc > 0) {
    const dur = parseFloat((mc / 60).toFixed(1));
    timeline.push({ t, action: `Ban all ${mc} members`, duration: dur, perm: 'BAN_MEMBERS', severity: 'critical' });
    t += dur;
  }
  if (hasPerm('MANAGE_CHANNELS') && cc > 0) {
    const dur = parseFloat((cc / 60).toFixed(1));
    timeline.push({ t, action: `Delete all ${cc} channels`, duration: dur, perm: 'MANAGE_CHANNELS', severity: 'critical' });
    t += dur;
  }
  if (hasPerm('MANAGE_GUILD_EXPRESSIONS')) {
    timeline.push({ t, action: 'Wipe all custom emojis and stickers', duration: 2, perm: 'MANAGE_GUILD_EXPRESSIONS', severity: 'high' });
    t += 2;
  }
  if (hasPerm('MANAGE_GUILD')) {
    timeline.push({ t, action: 'Vandalize server settings (name, icon, splash)', duration: 0.2, perm: 'MANAGE_GUILD', severity: 'high' });
    t += 0.2;
  }
  if (hasPerm('MANAGE_ROLES')) {
    const rc = blast.isAdmin ? roles.length : blast.assignableRoles.length;
    const dur = parseFloat((rc / 60).toFixed(1));
    timeline.push({ t, action: `Modify/delete ${rc} roles`, duration: dur, perm: 'MANAGE_ROLES', severity: 'high' });
    t += dur;
  }
  if (hasPerm('MODERATE_MEMBERS') && mc > 0) {
    const dur = parseFloat((mc / 60).toFixed(1));
    timeline.push({ t, action: `Timeout all ${mc} members`, duration: dur, perm: 'MODERATE_MEMBERS', severity: 'medium' });
    t += dur;
  }
  if (hasPerm('MANAGE_WEBHOOKS')) {
    timeline.push({ t, action: 'Create persistent backdoor webhooks on all channels', duration: 1, perm: 'MANAGE_WEBHOOKS', severity: 'high' });
    t += 1;
  }
  return { timeline, totalMinutes: parseFloat(t.toFixed(1)), blastScore: blast.blastScore };
}

function simulateRolePermChange(dump, roleId, permName, grant) {
  const modRoles = (dump.roles || []).map(r => {
    if (r.id !== roleId) return r;
    const newPerms = { ...r.permissions_decoded, [permName]: grant };
    const newDangerous = DANGEROUS_PERMS.filter(p => newPerms[p]);
    return { ...r, permissions_decoded: newPerms, dangerous_permissions: newDangerous, is_dangerous: newDangerous.length > 0, has_admin: !!newPerms.ADMINISTRATOR };
  });
  const holders = (dump.members || []).filter(m => m.roles.some(mr => mr.id === roleId));
  const beforeBlasts = holders.map(m => ({ member: m, blast: computeBlastRadius(m, dump.roles || [], dump.channels || []) }));
  const afterBlasts = holders.map(m => ({ member: m, blast: computeBlastRadius(m, modRoles, dump.channels || []) }));
  const newPaths = analyzeEscalationPaths(modRoles);
  return { modifiedRole: modRoles.find(r => r.id === roleId), holders, beforeBlasts, afterBlasts, escalationPaths: newPaths };
}

// ----------------------------------------------------------------------------
// VIEW: PERMISSION NETWORK (Canvas, hover via ref not state)
// ----------------------------------------------------------------------------

function PermissionNetworkView({ dump }) {
  const { colors, isDark } = useTheme();
  const containerRef = useRef(null);
  const simRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const hoveredRef = useRef(null);
  const adjRef = useRef({});
  const transformRef = useRef(d3.zoomIdentity);
  const drawRef = useRef(null);
  const [netSpread, setNetSpread] = useState(-350);
  const [channelFilter, setChannelFilter] = useState('all');
  const [dangerousOnly, setDangerousOnly] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];
    const seen = new Set();
    const add = (id, label, type, extra) => { if (seen.has(id)) return; seen.add(id); nodes.push({ id, label, type, connections: 0, ...extra }); };

    const chs = (dump.channels || []).filter(ch => {
      if (ch.type === 'CATEGORY') return false;
      if (channelFilter === 'text' && ch.type !== 'TEXT') return false;
      if (channelFilter === 'voice' && ch.type !== 'VOICE') return false;
      if (dangerousOnly && !ch.has_dangerous_overwrites) return false;
      return (ch.permission_overwrites || []).length > 0;
    });

    chs.forEach(ch => add(ch.id, '#' + ch.name, ch.type === 'VOICE' ? 'voice' : 'text', { overwrites: ch.permission_overwrites?.length || 0 }));

    chs.forEach(ch => {
      (ch.permission_overwrites || []).forEach(ow => {
        // In dangerous-only mode, skip non-dangerous overwrites entirely
        const isDangerous = (ow.dangerous_allows || []).length > 0;
        if (dangerousOnly && !isDangerous) return;

        const permLabel = isDangerous ? (ow.dangerous_allows || []).map(p => p.replace(/MANAGE_/g, '').replace(/MODERATE_/, 'TIMEOUT_').toLowerCase()).join(', ') : '';

        if (ow.target_type === 'role') {
          const role = (dump.roles || []).find(r => r.id === ow.target_id);
          if (role && role.name !== '@everyone') {
            add(role.id, role.name, 'role', { dangerous: role.is_dangerous, managed: role.managed, color: role.colorString });
            links.push({ source: role.id, target: ch.id, dangerous: isDangerous, deny: (ow.deny || []).length > 0 && !isDangerous, permCount: (ow.dangerous_allows || []).length || 1, label: permLabel });
          }
        } else if (ow.target_type === 'member') {
          add(ow.target_id, ow.target_name !== ow.target_id ? ow.target_name : 'User ..' + ow.target_id.slice(-4), 'user', { dangerous: isDangerous });
          links.push({ source: ow.target_id, target: ch.id, dangerous: isDangerous, deny: false, permCount: (ow.dangerous_allows || []).length || 1, label: permLabel });
        }
      });
    });

    links.forEach(l => {
      const sn = nodes.find(n => n.id === l.source);
      const tn = nodes.find(n => n.id === l.target);
      if (sn) sn.connections++;
      if (tn) tn.connections++;
    });

    // Filter to well-connected if too many
    if (nodes.length > 100) {
      const keep = new Set(nodes.filter(n => n.connections >= 2).map(n => n.id));
      return { nodes: nodes.filter(n => keep.has(n.id)), links: links.filter(l => keep.has(l.source) && keep.has(l.target)), filtered: true, total: nodes.length };
    }
    return { nodes, links, filtered: false, total: nodes.length };
  }, [dump, channelFilter, dangerousOnly]);

  // Build adjacency map
  useEffect(() => {
    const map = {};
    graphData.links.forEach(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      map[s] = map[s] || new Set(); map[s].add(t);
      map[t] = map[t] || new Set(); map[t].add(s);
    });
    adjRef.current = map;
  }, [graphData.links]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || graphData.nodes.length === 0) return;
    d3.select(container).selectAll('canvas').remove();

    const W = container.clientWidth || 900;
    const H = fullscreen ? window.innerHeight - 200 : 600;
    const dpr = window.devicePixelRatio || 1;

    const canvas = d3.select(container).append('canvas')
      .attr('width', W * dpr).attr('height', H * dpr)
      .style('width', W + 'px').style('height', H + 'px')
      .style('border-radius', '8px')
      .style('background', isDark ? '#0c0c1d' : '#fafbfe')
      .style('border', `1px solid ${isDark ? '#2a2a4a' : '#e2e4e9'}`)
      .style('cursor', 'grab');

    const ctx = canvas.node().getContext('2d');
    ctx.scale(dpr, dpr);

    const nodes = graphData.nodes.map(d => ({ ...d }));
    const links = graphData.links.map(d => ({ ...d }));
    nodesRef.current = nodes;
    linksRef.current = links;

    // Let d3 handle initial placement, then auto-fit

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(netSpread))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide().radius(d => Math.max(6, Math.sqrt(d.connections || 1) * 4) + 4))
      .force('x', d3.forceX(W / 2).strength(0.03))
      .force('y', d3.forceY(H / 2).strength(0.03));

    simRef.current = sim;

    function draw() {
      const transform = transformRef.current;
      const hov = hoveredRef.current;
      const adj = adjRef.current;
      const isConn = (a, b) => a === b || (adj[a] && adj[a].has(b));

      ctx.save();
      ctx.clearRect(0, 0, W, H);
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.k, transform.k);

      // Links
      links.forEach(l => {
        if (!l.source.x || !l.target.x) return;
        const hovConn = hov && (l.source.id === hov || l.target.id === hov);
        const dimmed = hov && !hovConn;
        ctx.beginPath();
        ctx.moveTo(l.source.x, l.source.y);
        ctx.lineTo(l.target.x, l.target.y);
        ctx.strokeStyle = dimmed ? (isDark ? '#111122' : '#f5f5f5') : l.dangerous ? '#ef4444' : l.deny ? '#f59e0b' : (isDark ? '#3a3a5a' : '#d1d5db');
        ctx.lineWidth = dimmed ? 0.3 : hovConn ? 2.5 : Math.max(0.5, Math.min(l.permCount * 0.3, 2.5));
        ctx.globalAlpha = dimmed ? 0.05 : hovConn ? 1 : 0.35;
        if (l.deny && !dimmed) { ctx.setLineDash([4, 3]); } else { ctx.setLineDash([]); }
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Nodes
      nodes.forEach(n => {
        const r = Math.max(5, Math.sqrt(n.connections || 1) * 4);
        const isHov = hov === n.id;
        const isConn2 = hov && (adj[hov]?.has(n.id) || n.id === hov);
        const dimmed = hov && !isConn2;

        ctx.globalAlpha = dimmed ? 0.06 : 1;

        if (n.type === 'voice') {
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? '#1e3a5f' : '#dbeafe'; ctx.fill();
          ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = isHov ? 3 : 1.5; ctx.stroke();
        } else if (n.type === 'text') {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i - Math.PI / 6; ctx[i === 0 ? 'moveTo' : 'lineTo'](n.x + r * Math.cos(a), n.y + r * Math.sin(a)); }
          ctx.closePath();
          ctx.fillStyle = isDark ? '#1a2e1a' : '#dcfce7'; ctx.fill();
          ctx.strokeStyle = '#22c55e'; ctx.lineWidth = isHov ? 3 : 1.5; ctx.stroke();
        } else if (n.type === 'role') {
          const rw = r * 2, rh = r * 1.2;
          ctx.beginPath(); ctx.roundRect(n.x - rw / 2, n.y - rh / 2, rw, rh, 3);
          ctx.fillStyle = n.dangerous ? (isDark ? '#7f1d1d' : '#fee2e2') : (isDark ? '#1a1a2e' : '#fff'); ctx.fill();
          ctx.strokeStyle = n.color || (n.dangerous ? '#ef4444' : (isDark ? '#4b5563' : '#d1d5db'));
          ctx.lineWidth = isHov ? 3 : 1.5; ctx.stroke();
        } else {
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle = n.dangerous ? (isDark ? '#7f1d1d' : '#fee2e2') : (isDark ? '#1e1b4b' : '#eef2ff'); ctx.fill();
          ctx.strokeStyle = n.dangerous ? '#ef4444' : '#6366f1'; ctx.lineWidth = isHov ? 3 : 1.5; ctx.stroke();
        }

        // Labels: ALWAYS show when zoomed in enough, show on hover+connected, or show for large nodes
        const showLabel = (transform.k > 1.2) || isHov || (isConn2 && !dimmed) || (n.connections >= 5 && !dimmed);
        if (showLabel && n.label) {
          ctx.globalAlpha = dimmed ? 0.06 : isHov ? 1 : 0.7;
          ctx.font = `${isHov ? 'bold 10px' : '9px'} 'JetBrains Mono', monospace`;
          ctx.fillStyle = isDark ? '#c4c4e0' : '#374151';
          ctx.textAlign = 'center';
          const label = n.label.length > 20 ? n.label.slice(0, 17) + '...' : n.label;
          // Background for readability
          const tw = ctx.measureText(label).width;
          ctx.globalAlpha = (dimmed ? 0.02 : 0.7);
          ctx.fillStyle = isDark ? '#0c0c1d' : '#fafbfe';
          ctx.fillRect(n.x - tw / 2 - 2, n.y + r + 4, tw + 4, 12);
          ctx.globalAlpha = dimmed ? 0.06 : isHov ? 1 : 0.7;
          ctx.fillStyle = isDark ? '#c4c4e0' : '#374151';
          ctx.fillText(label, n.x, n.y + r + 14);
        }
      });

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    drawRef.current = draw;
    sim.on('tick', draw);

    // Zoom
    const canvasZoom = d3.zoom().scaleExtent([0.2, 8]).on('zoom', (event) => {
      transformRef.current = event.transform;
      draw();
    });
    canvas.call(canvasZoom);

    // Auto-fit after settling
    setTimeout(() => {
      if (!nodes.length) return;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      nodes.forEach(n => { if (n.x != null) { x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); y0 = Math.min(y0, n.y); y1 = Math.max(y1, n.y); } });
      if (x0 === Infinity) return;
      const pad = 60;
      const scale = Math.min(W / (x1 - x0 + pad * 2), H / (y1 - y0 + pad * 2), 2) * 0.85;
      const tx = W / 2 - (x0 + x1) / 2 * scale;
      const ty = H / 2 - (y0 + y1) / 2 * scale;
      transformRef.current = d3.zoomIdentity.translate(tx, ty).scale(scale);
      canvas.call(canvasZoom.transform, transformRef.current);
      draw();
    }, 1000);

    // Mouse: find nearest node (NO setState for hover - use ref!)
    function findNode(event) {
      const [mx, my] = d3.pointer(event);
      const t = transformRef.current;
      const x = (mx - t.x) / t.k, y = (my - t.y) / t.k;
      let closest = null, minDist = 25 / t.k;
      nodes.forEach(n => { const dist = Math.hypot(n.x - x, n.y - y); if (dist < minDist) { closest = n; minDist = dist; } });
      return closest;
    }

    canvas.on('mousemove', (event) => {
      const node = findNode(event);
      const newHov = node ? node.id : null;
      if (hoveredRef.current !== newHov) {
        hoveredRef.current = newHov;
        canvas.style('cursor', node ? 'pointer' : 'grab');
        draw(); // Redraw canvas directly, NO React re-render
      }
    });

    canvas.on('mouseleave', () => {
      if (hoveredRef.current !== null) {
        hoveredRef.current = null;
        draw();
      }
    });

    canvas.on('click', (event) => {
      const node = findNode(event);
      setSelectedNode(node ? { ...node } : null); // Only setState on click, not hover
    });

    // Drag
    canvas.call(d3.drag()
      .subject((event) => findNode(event))
      .on('start', (event) => {
        if (!event.subject) return;
        if (!event.active) sim.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x; event.subject.fy = event.subject.y;
      })
      .on('drag', (event) => {
        if (!event.subject) return;
        const t = transformRef.current;
        event.subject.fx = (event.sourceEvent.offsetX - t.x) / t.k;
        event.subject.fy = (event.sourceEvent.offsetY - t.y) / t.k;
      })
      .on('end', (event) => {
        if (!event.subject) return;
        if (!event.active) sim.alphaTarget(0);
        event.subject.fx = null; event.subject.fy = null;
      })
    );

    return () => sim.stop();
  }, [graphData, isDark, fullscreen]);

  // Dynamic spread for permission network
  useEffect(() => {
    if (simRef.current) {
      simRef.current.force('charge', d3.forceManyBody().strength(netSpread).distanceMax(500));
      simRef.current.alpha(0.5).restart();
    }
  }, [netSpread]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {['all', 'text', 'voice'].map(f => (
          <button key={f} onClick={() => setChannelFilter(f)} style={{
            padding: '5px 10px', borderRadius: 5, fontSize: 12, cursor: 'pointer',
            border: `1px solid ${channelFilter === f ? colors.accent : colors.border}`,
            backgroundColor: channelFilter === f ? colors.accentBg : 'transparent',
            color: channelFilter === f ? colors.accent : colors.textSecondary,
            fontFamily: "'Space Grotesk', sans-serif", textTransform: 'capitalize',
          }}>{f}</button>
        ))}
        <button onClick={() => setDangerousOnly(!dangerousOnly)} style={{
          padding: '5px 10px', borderRadius: 5, fontSize: 12, cursor: 'pointer',
          border: `1px solid ${dangerousOnly ? '#ef4444' : colors.border}`,
          backgroundColor: dangerousOnly ? '#fef2f2' : 'transparent',
          color: dangerousOnly ? '#ef4444' : colors.textSecondary,
        }}>{dangerousOnly ? 'Dangerous only' : 'All overwrites'}</button>
        <button onClick={() => { if (simRef.current) simRef.current.alpha(0.5).restart(); }} style={{
          padding: '5px 10px', borderRadius: 5, fontSize: 12, cursor: 'pointer',
          border: `1px solid ${colors.border}`, backgroundColor: colors.bgAlt, color: colors.textSecondary,
        }}>Reheat</button>
        <button onClick={() => setFullscreen(!fullscreen)} style={{
          padding: '5px 10px', borderRadius: 5, fontSize: 12, cursor: 'pointer',
          border: `1px solid ${colors.border}`, backgroundColor: fullscreen ? colors.accentBg : colors.bgAlt,
          color: fullscreen ? colors.accent : colors.textSecondary,
        }}>{fullscreen ? 'Compact' : 'Expand'}</button>
        <label style={{ fontSize: 11, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
          Spread <input type="range" min={-600} max={-50} value={netSpread} onChange={e => setNetSpread(+e.target.value)} style={{ width: 80, accentColor: colors.accent }} />
        </label>
        <span style={{ fontSize: 10, color: colors.textMuted, marginLeft: 'auto' }}>
          {graphData.nodes.length} nodes | {graphData.links.length} edges
          {graphData.filtered && ` (from ${graphData.total})`}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: colors.textMuted }}>
        {[{ s: '⬡', c: '#22c55e', l: 'Text ch.' }, { s: '●', c: '#3b82f6', l: 'Voice ch.' }, { s: '■', c: isDark ? '#6b7280' : '#9ca3af', l: 'Role' }, { s: '●', c: '#6366f1', l: 'User' }].map(x => (
          <span key={x.l} style={{ color: x.c }}>{x.s} {x.l}</span>
        ))}
        <span style={{ color: '#ef4444' }}>— dangerous</span>
        <span style={{ color: '#f59e0b' }}>┈ deny</span>
        <span style={{ opacity: 0.6 }}>| Labels show on hover + zoom</span>
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <div ref={containerRef} style={{ width: '100%', minHeight: fullscreen ? window.innerHeight - 200 : 600 }}>
          {graphData.nodes.length === 0 && <EmptyState icon={Network} title="No permission relationships" desc="Try 'All overwrites' to see the full network." />}
        </div>
      </Card>

      {selectedNode && (
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: colors.text, fontFamily: "'JetBrains Mono', monospace" }}>{selectedNode.label}</span>
              <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 8 }}>{selectedNode.type} | {selectedNode.connections} connections</span>
            </div>
            <button onClick={() => setSelectedNode(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: colors.textMuted }}><X size={14} /></button>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(linksRef.current || [])
              .filter(l => (l.source.id || l.source) === selectedNode.id || (l.target.id || l.target) === selectedNode.id)
              .slice(0, 30)
              .map((l, i) => {
                const otherId = (l.source.id || l.source) === selectedNode.id ? (l.target.id || l.target) : (l.source.id || l.source);
                const other = (nodesRef.current || []).find(n => n.id === otherId);
                return (
                  <span key={i} style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 3,
                    backgroundColor: l.dangerous ? '#fef2f2' : colors.bgAlt,
                    color: l.dangerous ? '#dc2626' : colors.textSecondary,
                    fontFamily: "'JetBrains Mono', monospace",
                    border: `1px solid ${l.dangerous ? '#fecaca' : colors.border}`,
                  }}>{other?.label || '#' + otherId.slice(-6)}</span>
                );
              })}
          </div>
        </Card>
      )}
    </div>
  );
}

function ThreatMapView({ dump }) {
  const { colors, isDark } = useTheme();
  const containerRef = useRef(null);
  const simRef = useRef(null);
  const [spread, setSpread] = useState(-200);
  const [labelSize, setLabelSize] = useState(10);
  const [showLabels, setShowLabels] = useState(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);

  const ACTIONS = [
    { id: 'act-ban', label: 'Ban All', perm: 'BAN_MEMBERS', color: '#ff2d55', icon: '⚡' },
    { id: 'act-kick', label: 'Kick/Prune', perm: 'KICK_MEMBERS', color: '#ff6b35', icon: '⚡' },
    { id: 'act-roles', label: 'Assign Roles', perm: 'MANAGE_ROLES', color: '#ff6b35', icon: '⚡' },
    { id: 'act-guild', label: 'Manage Server', perm: 'MANAGE_GUILD', color: '#ffd60a', icon: '⚡' },
    { id: 'act-webhooks', label: 'Webhooks', perm: 'MANAGE_WEBHOOKS', color: '#ff6b35', icon: '⚡' },
    { id: 'act-channels', label: 'Delete Channels', perm: 'MANAGE_CHANNELS', color: '#ff2d55', icon: '⚡' },
    { id: 'act-messages', label: 'Manage Msgs', perm: 'MANAGE_MESSAGES', color: '#ffd60a', icon: '⚡' },
    { id: 'act-timeout', label: 'Timeout Members', perm: 'MODERATE_MEMBERS', color: '#ffd60a', icon: '⚡' },
    { id: 'act-emojis', label: 'Wipe Emojis', perm: 'MANAGE_GUILD_EXPRESSIONS', color: '#ff6b35', icon: '⚡' },
    { id: 'act-admin', label: 'ADMINISTRATOR', perm: 'ADMINISTRATOR', color: '#ff2d55', icon: '☠' },
  ];

  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];
    const seen = new Set();
    const add = (id, label, type, extra) => { if (seen.has(id)) return; seen.add(id); nodes.push({ id, label, type, ...extra }); };

    // Add action nodes
    ACTIONS.forEach(a => add(a.id, a.label, 'action', { color: a.color, radius: 14, icon: a.icon, perm: a.perm }));

    // Find dangerous members and their roles
    const dangerousRoles = (dump.roles || []).filter(r => (r.is_dangerous || r.has_admin) && r.name !== '@everyone' && !r.managed);
    const dangerousMembers = (dump.members || []).filter(m =>
      m.roles.some(mr => dangerousRoles.some(dr => dr.id === mr.id))
    );

    dangerousMembers.forEach(m => {
      const blast = computeBlastRadius(m, dump.roles || [], dump.channels || []);
      add('m-' + m.id, memberName(m), 'member', {
        color: m.is_admin ? '#ff2d55' : '#30d158',
        radius: m.is_admin ? 14 : 10,
        blast: blast?.blastScore || 0,
        icon: m.bot ? '⚙' : m.id === dump.guild?.owner_id ? '♛' : m.is_admin ? '☠' : '●',
      });

      // Link member to their dangerous roles
      m.roles.forEach(mr => {
        const role = dangerousRoles.find(r => r.id === mr.id);
        if (role) {
          add('r-' + role.id, role.name, 'role', {
            color: role.has_admin ? '#ff2d55' : '#ff6b35',
            radius: role.has_admin ? 16 : 12,
            icon: '♺',
          });
          links.push({ source: 'm-' + m.id, target: 'r-' + role.id, label: 'holds', color: '#5865f233', width: 1 });

          // Link role to actions it enables
          ACTIONS.forEach(a => {
            if (role.permissions_decoded?.[a.perm]) {
              links.push({ source: 'r-' + role.id, target: a.id, label: 'grants', color: a.color + '44', width: 1.5 });
            }
          });
        }
      });
    });

    // Remove unconnected action nodes
    const connectedIds = new Set();
    links.forEach(l => { connectedIds.add(typeof l.source === 'object' ? l.source.id : l.source); connectedIds.add(typeof l.target === 'object' ? l.target.id : l.target); });
    return { nodes: nodes.filter(n => connectedIds.has(n.id)), links };
  }, [dump]);

  // Dynamic charge update
  useEffect(() => {
    if (simRef.current) {
      simRef.current.force('charge', d3.forceManyBody().strength(spread).distanceMax(400));
      simRef.current.alpha(0.5).restart();
    }
  }, [spread]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || graphData.nodes.length === 0) return;
    d3.select(container).selectAll('*').remove();

    const W = container.clientWidth || 900;
    const H = 580;

    const svg = d3.select(container).append('svg')
      .attr('width', W).attr('height', H)
      .style('border-radius', '8px')
      .style('background', isDark ? '#0c0c1d' : '#fafbfe')
      .style('border', `1px solid ${isDark ? '#2a2a4a' : '#e2e4e9'}`)
      .style('cursor', 'grab')
      .style('font-family', "'JetBrains Mono', monospace");

    const defs = svg.append('defs');
    defs.append('marker').attr('id', 'tm-arr').attr('viewBox', '0 0 10 10').attr('refX', 20).attr('refY', 5)
      .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
      .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', isDark ? '#666' : '#999');
    const glow = defs.append('filter').attr('id', 'tm-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    glow.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).join('feMergeNode').attr('in', d => d);

    const g = svg.append('g');
    const zoomBehavior = d3.zoom().scaleExtent([0.2, 5]).on('zoom', e => g.attr('transform', e.transform));
    svg.call(zoomBehavior);

    const nodes = graphData.nodes.map(d => ({ ...d }));
    const links = graphData.links.map(d => ({ ...d }));

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(spread).distanceMax(400))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide().radius(d => (d.radius || 10) + 6))
      .force('x', d3.forceX(W / 2).strength(0.03))
      .force('y', d3.forceY(H / 2).strength(0.03));

    simRef.current = sim;

    // Links
    const linkG = g.append('g');
    const linkEls = linkG.selectAll('line').data(links).join('line')
      .attr('stroke', d => d.color || (isDark ? '#4a4a6a44' : '#d1d5db'))
      .attr('stroke-width', d => d.width || 1)
      .attr('marker-end', 'url(#tm-arr)');

    // Edge labels
    const edgeLabelEls = linkG.selectAll('text').data(links).join('text')
      .attr('text-anchor', 'middle').attr('fill', isDark ? '#666688' : '#9ca3af')
      .attr('font-size', 8).attr('pointer-events', 'none')
      .text(d => d.label || '')
      .style('display', showEdgeLabels ? 'block' : 'none');

    // Nodes
    const nodeG = g.append('g');
    const nodeEls = nodeG.selectAll('g').data(nodes).join('g').attr('cursor', 'pointer');

    nodeEls.append('circle')
      .attr('r', d => d.radius || 10)
      .attr('fill', d => (d.color || '#4a4a6a') + '33')
      .attr('stroke', d => d.color || '#4a4a6a')
      .attr('stroke-width', 2);

    // Icons inside nodes
    nodeEls.append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('font-size', d => (d.radius || 10) * 0.8)
      .attr('fill', d => d.color || '#4a4a6a')
      .attr('pointer-events', 'none')
      .text(d => d.icon || '');

    // Labels to the RIGHT of nodes
    const labelEls = nodeEls.append('text')
      .attr('x', d => (d.radius || 10) + 5).attr('dy', '0.35em')
      .attr('text-anchor', 'start')
      .attr('fill', isDark ? '#ccccdd' : '#374151')
      .attr('font-size', labelSize).attr('font-weight', 500)
      .attr('pointer-events', 'none')
      .text(d => d.label?.length > 18 ? d.label.slice(0, 16) + '..' : d.label)
      .style('display', showLabels ? 'block' : 'none');

    // Hover: dim unconnected
    const adj = {};
    links.forEach(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      adj[s] = adj[s] || new Set(); adj[s].add(t);
      adj[t] = adj[t] || new Set(); adj[t].add(s);
    });

    nodeEls.on('mouseover', function(event, d) {
      d3.select(this).select('circle').attr('filter', 'url(#tm-glow)').attr('stroke-width', 3);
      const connected = new Set([d.id]);
      (adj[d.id] || new Set()).forEach(id => connected.add(id));
      nodeEls.style('opacity', n => connected.has(n.id) ? 1 : 0.12);
      linkEls.style('opacity', l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.05);
      edgeLabelEls.style('opacity', l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0);
    }).on('mouseout', function() {
      d3.select(this).select('circle').attr('filter', null).attr('stroke-width', 2);
      nodeEls.style('opacity', 1);
      linkEls.style('opacity', 1);
      edgeLabelEls.style('opacity', 1);
    });

    // Drag
    nodeEls.call(d3.drag()
      .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
    );

    sim.on('tick', () => {
      linkEls.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      edgeLabelEls.attr('x', d => (d.source.x + d.target.x) / 2).attr('y', d => (d.source.y + d.target.y) / 2);
      nodeEls.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Auto-fit
    autoFitZoom(svg, nodes, W, H, zoomBehavior);

    return () => sim.stop();
  }, [graphData, isDark]);

  // Update labels when controls change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    d3.select(container).selectAll('g > g > g > text:last-of-type')
      .style('display', showLabels ? 'block' : 'none')
      .attr('font-size', labelSize);
  }, [showLabels, labelSize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    d3.select(container).selectAll('g > g:first-of-type > text')
      .style('display', showEdgeLabels ? 'block' : 'none');
  }, [showEdgeLabels]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <GraphControls spread={spread} setSpread={setSpread} labelSize={labelSize} setLabelSize={setLabelSize}
        showLabels={showLabels} setShowLabels={setShowLabels} showEdgeLabels={showEdgeLabels} setShowEdgeLabels={setShowEdgeLabels}
        nodeCount={graphData.nodes.length} edgeCount={graphData.links.length} />
      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: colors.textMuted }}>
        {[{ c: '#ff2d55', l: '☠ Admin' }, { c: '#ff6b35', l: '♺ Dangerous Role' }, { c: '#30d158', l: '● Member' }, { c: '#5865f2', l: '⚙ Bot' }, { c: '#ffd60a', l: '⚡ Action' }].map(x => (
          <span key={x.l} style={{ color: x.c }}>{x.l}</span>
        ))}
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <div ref={containerRef} style={{ width: '100%', minHeight: 580 }}>
          {graphData.nodes.length === 0 && <EmptyState icon={Target} title="No dangerous members" desc="No members with dangerous roles found in cached data." />}
        </div>
      </Card>
    </div>
  );
}
function NukeGraph({ member, nukeResult, dump, isDark, colors }) {
  const containerRef = useRef(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !nukeResult || nukeResult.timeline.length === 0) return;
    d3.select(container).selectAll('*').remove();

    const W = container.clientWidth || 800;
    const H = 400;
    const nodes = [];
    const links = [];
    const seen = new Set();
    const add = (id, label, type, group) => { if (seen.has(id)) return; seen.add(id); nodes.push({ id, label, type, group, destroyed: false }); };

    add(member.id, memberName(member), 'attacker', 0);

    nukeResult.timeline.forEach((step, i) => {
      const permId = `perm-${step.perm}`;
      add(permId, step.perm.replace('MANAGE_', '').replace('MODERATE_', 'TIMEOUT_'), 'permission', 1);
      links.push({ source: member.id, target: permId });

      const targets = [];
      if (step.perm === 'BAN_MEMBERS' || step.perm === 'MODERATE_MEMBERS') {
        (dump.members || []).slice(0, 8).forEach(m => {
          if (m.id !== member.id) { const tid = `target-${m.id}`; add(tid, memberName(m), 'victim', 2); targets.push(tid); }
        });
        if ((dump.members || []).length > 8) { add(`more-members`, `+${(dump.members || []).length - 8} more`, 'victim', 2); targets.push('more-members'); }
      } else if (step.perm === 'MANAGE_CHANNELS') {
        (dump.channels || []).filter(c => c.type !== 'CATEGORY').slice(0, 8).forEach(c => {
          const tid = `target-${c.id}`; add(tid, '#' + c.name.slice(0, 12), 'channel', 2); targets.push(tid);
        });
        const chCount = (dump.channels || []).filter(c => c.type !== 'CATEGORY').length;
        if (chCount > 8) { add('more-channels', `+${chCount - 8} more`, 'channel', 2); targets.push('more-channels'); }
      } else if (step.perm === 'MANAGE_ROLES') {
        (dump.roles || []).filter(r => r.name !== '@everyone').slice(0, 6).forEach(r => {
          const tid = `target-${r.id}`; add(tid, r.name.slice(0, 12), 'role', 2); targets.push(tid);
        });
      } else {
        add(`target-${step.perm}`, step.action.slice(0, 20), 'resource', 2);
        targets.push(`target-${step.perm}`);
      }
      targets.forEach(t => links.push({ source: permId, target: t }));
    });

    const svg = d3.select(container).append('svg')
      .attr('width', W).attr('height', H)
      .style('border-radius', '8px')
      .style('background', isDark ? '#0c0c1d' : '#fafbfe')
      .style('border', `1px solid ${isDark ? '#2a2a4a' : '#e2e4e9'}`)
      .style('font-family', "'JetBrains Mono', monospace");

    const defs = svg.append('defs');
    const glow = defs.append('filter').attr('id', 'nuke-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '5').attr('result', 'blur');
    glow.append('feMerge').selectAll('feMergeNode').data(['blur', 'SourceGraphic']).join('feMergeNode').attr('in', d => d);

    const g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([0.3, 4]).on('zoom', e => g.attr('transform', e.transform)));

    const nc = nodes.map(d => ({ ...d, x: W / 2, y: H / 2 }));
    const lc = links.map(d => ({ ...d }));

    const sim = d3.forceSimulation(nc)
      .force('link', d3.forceLink(lc).id(d => d.id).distance(60).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-120).distanceMax(250))
      .force('x', d3.forceX().x(d => d.group === 0 ? W * 0.15 : d.group === 1 ? W * 0.45 : W * 0.78).strength(0.1))
      .force('y', d3.forceY(H / 2).strength(0.05))
      .force('collide', d3.forceCollide(16))
      .alphaDecay(0.03);

    const linkEls = g.selectAll('line').data(lc).join('line')
      .attr('stroke', isDark ? '#4b5563' : '#d1d5db').attr('stroke-width', 1.5).attr('opacity', 0.3);

    const nodeEls = g.selectAll('g.nuke-node').data(nc).join('g').attr('class', 'nuke-node');

    nodeEls.each(function(d) {
      const el = d3.select(this);
      if (d.type === 'attacker') {
        el.append('circle').attr('r', 18).attr('fill', '#dc2626').attr('stroke', '#fff').attr('stroke-width', 2);
        el.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'central').attr('fill', '#fff').attr('font-size', 14).text('☠');
      } else if (d.type === 'permission') {
        el.append('polygon').attr('points', '0,-14 14,0 0,14 -14,0').attr('fill', '#ea580c').attr('stroke', '#fff').attr('stroke-width', 1);
        el.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'central').attr('fill', '#fff').attr('font-size', 7).attr('font-weight', 600).text(d.label.slice(0, 8));
      } else {
        const color = d.type === 'victim' ? '#3b82f6' : d.type === 'channel' ? '#22c55e' : d.type === 'role' ? '#8b5cf6' : '#6b7280';
        el.append('circle').attr('r', 10).attr('fill', isDark ? `${color}40` : `${color}20`).attr('stroke', color).attr('stroke-width', 1);
      }
      if (d.type !== 'attacker' && d.type !== 'permission') {
        el.append('text').attr('y', 16).attr('text-anchor', 'middle').attr('fill', isDark ? '#9ca3af' : '#6b7280').attr('font-size', 7).text(d.label?.slice(0, 14));
      }
    });

    // Animate destruction wave on click
    nodeEls.filter(d => d.type === 'attacker').on('click', () => {
      setAnimating(true);
      const depths = {};
      const queue = [{ id: nc[0].id, depth: 0 }];
      depths[nc[0].id] = 0;
      while (queue.length > 0) {
        const { id, depth } = queue.shift();
        lc.forEach(l => {
          const sid = l.source.id || l.source;
          const tid = l.target.id || l.target;
          if (sid === id && depths[tid] === undefined) { depths[tid] = depth + 1; queue.push({ id: tid, depth: depth + 1 }); }
        });
      }
      const maxD = Math.max(...Object.values(depths), 1);
      nodeEls.each(function(d) {
        const delay = (depths[d.id] || 0) * 400;
        d3.select(this).select('circle, polygon')
          .transition().delay(delay).duration(300)
          .attr('fill', '#dc2626').attr('stroke', '#991b1b').attr('filter', 'url(#nuke-glow)');
      });
      linkEls.each(function(l) {
        const sDepth = depths[l.source.id || l.source] || 0;
        d3.select(this).transition().delay(sDepth * 400).duration(300).attr('stroke', '#dc2626').attr('opacity', 0.7);
      });
      setTimeout(() => setAnimating(false), maxD * 400 + 500);
    });

    nodeEls.call(d3.drag()
      .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
    );

    sim.on('tick', () => {
      linkEls.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      nodeEls.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [member, nukeResult, dump, isDark]);

  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, fontFamily: "'Space Grotesk', sans-serif" }}>Destruction Network</div>
        <span style={{ fontSize: 10, color: colors.textMuted }}>Click the skull to animate the destruction wave</span>
      </div>
      <div ref={containerRef} style={{ width: '100%', minHeight: 400 }} />
    </Card>
  );
}

// ----------------------------------------------------------------------------
// VIEW: SIMULATION ENGINE
// ----------------------------------------------------------------------------

function SimulateView({ dump }) {
  const { colors, isDark } = useTheme();
  const [simType, setSimType] = useState('compromise');
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPerm, setSelectedPerm] = useState('MANAGE_WEBHOOKS');
  const [grantPerm, setGrantPerm] = useState(true);

  const members = dump.members || [];
  const roles = (dump.roles || []).filter(r => r.name !== '@everyone');
  const defaultRole = useMemo(() => {
    const dangerous = roles.filter(r => r.is_dangerous && !r.managed).sort((a, b) => b.position - a.position);
    return dangerous.find(r => members.some(m => m.roles.some(mr => mr.id === r.id))) || dangerous[0] || roles[0] || null;
  }, [roles, members]);
  useEffect(() => { if (!selectedRole && defaultRole) setSelectedRole(defaultRole); }, [defaultRole]);

  // Compromise simulation
  const nukeResult = useMemo(() => {
    if (simType !== 'compromise' || !selectedMember) return null;
    return computeNukeTimeline(selectedMember, dump.roles || [], dump.channels || [], members);
  }, [simType, selectedMember, dump]);

  // Role permission change simulation
  const permChangeResult = useMemo(() => {
    if (simType !== 'rolechange' || !selectedRole) return null;
    return simulateRolePermChange(dump, selectedRole.id, selectedPerm, grantPerm);
  }, [simType, selectedRole, selectedPerm, grantPerm, dump]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[{ id: 'compromise', label: 'Account Compromised' }, { id: 'selfbot', label: 'Selfbot Recon' }, { id: 'webhook', label: 'Webhook Leak' }, { id: 'rolechange', label: 'Role Permission Change' }, { id: 'whatif', label: 'What-If Scenarios' }].map(s => (
          <button key={s.id} onClick={() => setSimType(s.id)} style={{
            padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${simType === s.id ? colors.accent : colors.border}`,
            backgroundColor: simType === s.id ? colors.accentBg : colors.bgAlt,
            color: simType === s.id ? colors.accent : colors.textSecondary,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>{s.label}</button>
        ))}
      </div>

      {simType === 'compromise' && (
        <>
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>Select a member to simulate compromise</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {members.sort((a, b) => (computeBlastRadius(b, dump.roles||[], dump.channels||[])?.blastScore||0) - (computeBlastRadius(a, dump.roles||[], dump.channels||[])?.blastScore||0)).slice(0, 20).map(m => {
                const bs = computeBlastRadius(m, dump.roles||[], dump.channels||[])?.blastScore || 0;
                const sel = selectedMember?.id === m.id;
                return (
                  <button key={m.id} onClick={() => setSelectedMember(m)} style={{
                    padding: '4px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
                    border: `1px solid ${sel ? '#dc2626' : colors.border}`,
                    backgroundColor: sel ? '#fef2f2' : colors.bgAlt,
                    color: sel ? '#dc2626' : colors.textSecondary,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {memberName(m)} <span style={{ opacity: 0.5 }}>({bs})</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Destruction network graph */}
          {selectedMember && nukeResult && nukeResult.timeline.length > 0 && (
            <NukeGraph member={selectedMember} nukeResult={nukeResult} dump={dump} isDark={isDark} colors={colors} />
          )}

          {nukeResult && (
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
                Nuke Timeline: {memberName(selectedMember)}
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 16 }}>
                Blast Score: {nukeResult.blastScore}/100 | Total destruction time: ~{nukeResult.totalMinutes} minutes
              </div>

              {nukeResult.timeline.length === 0 ? (
                <div style={{ fontSize: 13, color: colors.textMuted }}>This member has no destructive permissions.</div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 24 }}>
                  <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, backgroundColor: isDark ? '#4b5563' : '#e5e7eb' }} />
                  {nukeResult.timeline.map((step, i) => {
                    const sevColor = step.severity === 'critical' ? '#dc2626' : step.severity === 'high' ? '#ea580c' : '#ca8a04';
                    return (
                      <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: -20, top: 4, width: 12, height: 12, borderRadius: 6, backgroundColor: sevColor, border: `2px solid ${isDark ? '#0c0c1d' : '#fff'}` }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>T+{step.t.toFixed(1)} min</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{step.action}</div>
                          <div style={{ fontSize: 11, color: sevColor }}>~{step.duration.toFixed(1)} min | {step.perm}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {simType === 'rolechange' && (
        <>
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
              What if a role {grantPerm ? 'gains' : 'loses'} a permission?
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <select value={selectedRole?.id || ''} onChange={e => setSelectedRole(roles.find(r => r.id === e.target.value) || null)} style={{
                padding: '6px 10px', borderRadius: 5, fontSize: 12, border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text, minWidth: 180,
              }}>
                <option value="">Select role...</option>
                {roles.sort((a, b) => b.position - a.position).map(r => <option key={r.id} value={r.id}>{r.name} (pos {r.position})</option>)}
              </select>
              <select value={selectedPerm} onChange={e => setSelectedPerm(e.target.value)} style={{
                padding: '6px 10px', borderRadius: 5, fontSize: 12, border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text,
              }}>
                {DANGEROUS_PERMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={() => setGrantPerm(!grantPerm)} style={{
                padding: '6px 12px', borderRadius: 5, fontSize: 12, cursor: 'pointer',
                border: `1px solid ${grantPerm ? '#16a34a' : '#dc2626'}`,
                backgroundColor: grantPerm ? '#f0fdf4' : '#fef2f2',
                color: grantPerm ? '#16a34a' : '#dc2626',
              }}>{grantPerm ? '+ Grant' : '- Revoke'}</button>
            </div>
          </Card>

          {permChangeResult && selectedRole && (
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>
                Impact: {grantPerm ? 'Granting' : 'Revoking'} {selectedPerm} on "{selectedRole.name}"
              </div>
              <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
                Affects {permChangeResult.holders.length} members holding this role.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {permChangeResult.afterBlasts.map(({ member, blast }, i) => {
                  const before = permChangeResult.beforeBlasts[i]?.blast;
                  const diff = (blast?.blastScore || 0) - (before?.blastScore || 0);
                  if (diff === 0) return null;
                  return (
                    <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 4, backgroundColor: colors.bgAlt }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: colors.text, fontFamily: "'JetBrains Mono', monospace", minWidth: 100 }}>
                        {memberName(member)}
                      </div>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>Blast: {before?.blastScore || 0}</div>
                      <div style={{ fontSize: 12, color: diff > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>→ {blast?.blastScore || 0} ({diff > 0 ? '+' : ''}{diff})</div>
                      {diff > 10 && <SeverityBadge severity="HIGH" />}
                    </div>
                  );
                }).filter(Boolean)}
                {permChangeResult.afterBlasts.every(({ blast }, i) => (blast?.blastScore || 0) === (permChangeResult.beforeBlasts[i]?.blast?.blastScore || 0)) && (
                  <div style={{ fontSize: 12, color: colors.textMuted }}>No change in blast radius scores for any member.</div>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Selfbot Recon scenario */}
      {simType === 'selfbot' && (
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>
            Selfbot Reconnaissance Capabilities
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 16 }}>
            What a user-token selfbot can do from this server with zero special permissions.
          </div>
          {[
            { title: 'Message Scraping', desc: `All visible channels (~${(dump.channels||[]).filter(c=>c.type==='TEXT').length} text channels). Rate: ~6,000 messages/minute. Zero detection, no audit log entries.`, severity: 'critical', icon: '📨' },
            { title: 'Presence Monitoring', desc: `Track online/offline/idle status, game activity, Spotify, streaming, and platform (desktop/mobile/web) for all ${dump.members?.length || 0} cached members. Completely passive, zero API calls after gateway connection.`, severity: 'high', icon: '👁' },
            { title: 'Thread Spam', desc: (() => { const ev = (dump.roles||[]).find(r=>r.name==='@everyone'); return ev?.permissions_decoded?.CREATE_PUBLIC_THREADS ? `@everyone CAN create public threads. ${(dump.channels||[]).filter(c=>c.type==='TEXT').length} channels vulnerable to thread spam.` : '@everyone CANNOT create threads. This vector is mitigated.'; })(), severity: (dump.roles||[]).find(r=>r.name==='@everyone')?.permissions_decoded?.CREATE_PUBLIC_THREADS ? 'high' : 'safe', icon: '🧵' },
            { title: 'Voice Disruption', desc: `${(dump.channels||[]).filter(c=>c.type==='VOICE').length} voice channels. Rapid join/leave has NO rate limit cooldown. Soundboard abuse has NO admin-configurable cooldown.`, severity: 'medium', icon: '🔊' },
            { title: 'Reaction Bombing', desc: 'Up to 20 unique reactions per message at ~4/second. No audit log entries for reactions.', severity: 'low', icon: '💥' },
            { title: 'DM Spam from Server', desc: `Can DM ~10 new users per 10 minutes using the server member list. ${dump.members?.length || 0} potential targets from cached members alone.`, severity: 'medium', icon: '✉️' },
            { title: 'Mass Reporting', desc: (() => { const disc = (dump.guild?.features||[]).includes('DISCOVERABLE'); return disc ? 'Server is in Discovery. Coordinated mass reporting from multiple selfbot accounts can trigger automated delisting. Discord processes ~29.5M reports per half-year.' : 'Server not in Discovery. Mass reporting is less impactful but can still trigger T&S investigation.'; })(), severity: (dump.guild?.features||[]).includes('DISCOVERABLE') ? 'critical' : 'medium', icon: '🚨' },
            { title: 'Profile Impersonation', desc: 'Selfbot can copy username, avatar, and display name of any server member. Combined with DM spam, enables targeted phishing.', severity: 'high', icon: '🎭' },
            { title: 'Invite Hijacking', desc: (() => { const vanity = dump.guild?.vanity_url_code; return vanity ? `Server has vanity URL "/${vanity}". If boost level drops, selfbots with <100ms response times can snipe the URL for phishing.` : 'No vanity URL. Standard invite links are not snipeable.'; })(), severity: dump.guild?.vanity_url_code ? 'high' : 'low', icon: '🔗' },
            { title: 'Social Graph Mapping', desc: `Mutual servers and friends visible on all ${dump.members?.length || 0} cached member profiles. Can reconstruct membership overlap graphs, infer interests, locations, identities.`, severity: 'medium', icon: '🕸' },
            { title: 'Server Template Exfiltration', desc: (() => { const mgRoles = (dump.roles||[]).filter(r=>r.permissions_decoded?.MANAGE_GUILD); return mgRoles.length > 0 ? `${mgRoles.length} roles with MANAGE_GUILD can create templates. Full channel/role/permission structure captured with ZERO audit log trail.` : 'No selfbot with MANAGE_GUILD access.'; })(), severity: (dump.roles||[]).filter(r=>r.permissions_decoded?.MANAGE_GUILD).length > 0 ? 'high' : 'safe', icon: '📋' },
            { title: 'Slowmode Bypass', desc: 'Three confirmed bypasses: (1) editing existing messages ignores slowmode, (2) threads have independent slowmode often unconfigured, (3) reactions completely unaffected.', severity: 'low', icon: '⏱' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, padding: '10px 14px', marginBottom: 8, borderRadius: 6,
              backgroundColor: item.severity === 'safe' ? (isDark ? '#052e1620' : '#f0fdf4') : colors.bgAlt,
              borderLeft: `3px solid ${item.severity === 'critical' ? '#dc2626' : item.severity === 'high' ? '#ea580c' : item.severity === 'medium' ? '#ca8a04' : item.severity === 'safe' ? '#16a34a' : '#6b7280'}`,
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{item.title}</div>
                <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5, marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Webhook Leak scenario */}
      {simType === 'webhook' && (() => {
        const whRoles = (dump.roles||[]).filter(r=>r.permissions_decoded?.MANAGE_WEBHOOKS);
        const whOverwrites = [];
        (dump.channels||[]).forEach(ch => {
          (ch.permission_overwrites||[]).forEach(ow => {
            if ((ow.dangerous_allows||[]).includes('MANAGE_WEBHOOKS')) whOverwrites.push({ channel: ch, overwrite: ow });
          });
        });
        return (
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>
              Webhook URL Leak Impact
            </div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 16 }}>
              What happens when a webhook URL is leaked or stolen. Zero authentication required.
            </div>
            {[
              { title: 'AutoMod Complete Bypass', desc: 'Webhook messages bypass ALL AutoMod rules. Any content (scam links, slurs, phishing) passes through unfiltered.', severity: 'critical' },
              { title: '@everyone Pings Without Permission', desc: 'Webhook messages can ping @everyone by default. The server mention permission setting does not apply to webhooks.', severity: 'critical' },
              { title: 'Identity Impersonation', desc: 'Custom username and avatar per message. Can impersonate any user, moderator, or bot (bypassed only for "discord" and "clyde" names).', severity: 'high' },
              { title: 'Persistent Backdoor', desc: 'Webhook URLs never expire. Survives user bans, kicks, role removal, and permission changes. Only explicit deletion removes access.', severity: 'critical' },
              { title: 'Message Editing Bait-and-Switch', desc: 'Edit any webhook message after posting. A benign message can become @everyone phishing after building trust.', severity: 'high' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '10px 14px', marginBottom: 8, borderRadius: 6,
                backgroundColor: colors.bgAlt,
                borderLeft: `3px solid ${item.severity === 'critical' ? '#dc2626' : '#ea580c'}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5, marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 6, backgroundColor: isDark ? '#7f1d1d20' : '#fef2f2', border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>Webhook Exposure in This Server</div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>
                {whRoles.length} roles with MANAGE_WEBHOOKS: {whRoles.map(r => r.name).join(', ') || 'none'}
              </div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>
                {whOverwrites.length} channel-level MANAGE_WEBHOOKS overwrites
              </div>
            </div>
          </Card>
        );
      })()}

      {/* What-If Scenarios */}
      {simType === 'whatif' && (() => {
        const scenarios = [
          { title: 'Enable 2FA requirement', check: () => {
            const mitigated = ['QR Code Login 2FA Bypass', 'Token theft via compromised moderator'];
            return dump.guild?.mfa_level === 0 ? { impact: 'high', desc: `Server currently has NO 2FA requirement. Enabling it would require all moderators to have 2FA, mitigating account takeover of mod accounts without 2FA.` } : { impact: 'none', desc: '2FA is already required. No change.' };
          }},
          { title: 'Delete all user-specific overwrites', check: () => {
            let count = 0;
            (dump.channels||[]).forEach(ch => { (ch.permission_overwrites||[]).forEach(ow => { if (ow.target_type === 'member') count++; }); });
            return { impact: count > 20 ? 'high' : count > 0 ? 'medium' : 'none', desc: `Would remove ${count} user-specific overwrites across all channels. These survive role removal and are the primary persistence mechanism.` };
          }},
          { title: 'Restrict @everyone from thread creation', check: () => {
            const ev = (dump.roles||[]).find(r=>r.name==='@everyone');
            const can = ev?.permissions_decoded?.CREATE_PUBLIC_THREADS;
            return { impact: can ? 'medium' : 'none', desc: can ? `@everyone currently CAN create threads in all text channels. Disabling eliminates thread spam vector.` : 'Thread creation already restricted.' };
          }},
          { title: 'Move all bot roles above staff roles', check: () => {
            const staffMax = Math.max(...(dump.roles||[]).filter(r => r.is_dangerous && !r.managed && !r.has_admin).map(r => r.position), 0);
            const botBelow = (dump.roles||[]).filter(r => r.managed && r.is_dangerous && r.position < staffMax);
            return { impact: botBelow.length > 0 ? 'medium' : 'none', desc: botBelow.length > 0 ? `${botBelow.length} managed bot roles with dangerous perms are below staff position ${staffMax}. Moving them above would prevent staff from assigning these roles.` : 'All bot roles are already above staff roles.' };
          }},
        ];
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scenarios.map((s, i) => {
              const result = s.check();
              const color = result.impact === 'high' ? '#dc2626' : result.impact === 'medium' ? '#ca8a04' : '#16a34a';
              return (
                <Card key={i} style={{ padding: '12px 16px', borderLeft: `3px solid ${color}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>{result.desc}</div>
                  <span style={{ fontSize: 10, fontWeight: 600, color, marginTop: 4, display: 'inline-block' }}>
                    {result.impact === 'none' ? 'NO CHANGE' : result.impact === 'high' ? 'HIGH IMPACT' : 'MODERATE IMPACT'}
                  </span>
                </Card>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

// ----------------------------------------------------------------------------
// VIEW: THREAT SURFACE SCORECARD (109 vectors)
// ----------------------------------------------------------------------------

function ThreatScorecardView({ dump }) {
  const { colors, isDark } = useTheme();
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedVector, setExpandedVector] = useState(null);

  const results = useMemo(() => runThreatDetection(dump), [dump]);

  const filtered = useMemo(() => {
    let r = results;
    if (catFilter !== 'all') r = r.filter(v => v.category === catFilter);
    if (statusFilter !== 'all') r = r.filter(v => v.status === statusFilter);
    return r;
  }, [results, catFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: results.length,
    vulnerable: results.filter(v => v.status === 'vulnerable').length,
    partial: results.filter(v => v.status === 'partial').length,
    safe: results.filter(v => v.status === 'safe').length,
    undetectable: results.filter(v => v.status === 'undetectable').length,
  }), [results]);

  const statusColor = { vulnerable: '#dc2626', partial: '#ca8a04', safe: '#16a34a', undetectable: '#6b7280' };
  const statusLabel = { vulnerable: 'VULNERABLE', partial: 'PARTIAL', safe: 'SAFE', undetectable: 'NOT DETECTABLE' };
  const impactColor = { destruction: '#dc2626', severe: '#ea580c', moderate: '#ca8a04', nuisance: '#6b7280' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary bar */}
      <Card style={{ padding: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
          Threat Surface Scorecard
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: colors.text }}>{stats.total}</div>
            <div style={{ fontSize: 10, color: colors.textMuted }}>Total Vectors</div>
          </div>
          {[{ k: 'vulnerable', l: 'Active Risks' }, { k: 'partial', l: 'Partial' }, { k: 'safe', l: 'Safe' }, { k: 'undetectable', l: 'Need Data' }].map(s => (
            <div key={s.k} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setStatusFilter(statusFilter === s.k ? 'all' : s.k)}>
              <div style={{ fontSize: 28, fontWeight: 800, color: statusColor[s.k] }}>{stats[s.k]}</div>
              <div style={{ fontSize: 10, color: colors.textMuted }}>{s.l}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{
          padding: '6px 10px', borderRadius: 5, fontSize: 12, border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text,
        }}>
          <option value="all">All categories</option>
          {THREAT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{
          padding: '6px 10px', borderRadius: 5, fontSize: 12, border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text,
        }}>
          <option value="all">All statuses</option>
          <option value="vulnerable">Vulnerable</option>
          <option value="partial">Partial</option>
          <option value="safe">Safe</option>
          <option value="undetectable">Not detectable</option>
        </select>
        <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 'auto' }}>{filtered.length} vectors shown</span>
      </div>

      {/* Vector list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map(v => {
          const isExpanded = expandedVector === v.id;
          return (
            <Card key={v.id} style={{ overflow: 'hidden' }}>
              <div onClick={() => setExpandedVector(isExpanded ? null : v.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer',
                borderLeft: `3px solid ${statusColor[v.status]}`,
              }}>
                {isExpanded ? <ChevronDown size={14} style={{ color: colors.textMuted }} /> : <ChevronRight size={14} style={{ color: colors.textMuted }} />}
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, backgroundColor: `${statusColor[v.status]}18`, color: statusColor[v.status], fontFamily: "'JetBrains Mono', monospace" }}>
                  {statusLabel[v.status]}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.text, flex: 1 }}>{v.name}</span>
                <span style={{ fontSize: 10, color: colors.textMuted, whiteSpace: 'nowrap' }}>{v.category}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: impactColor[v.impact] || colors.textMuted }}>{v.impact}</span>
                {v.conf > 0 && <span style={{ fontSize: 9, color: colors.textMuted }}>{v.conf}%</span>}
              </div>
              {isExpanded && (
                <div style={{ padding: '12px 14px 14px', borderTop: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 8 }}>
                    <strong>Finding:</strong> {v.finding}
                  </div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>
                    <strong>Access required:</strong> {v.access} | <strong>Impact:</strong> {v.impact} | <strong>Vector ID:</strong> {v.id}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
// ----------------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------------

export default function DiscordSecurityVisualizer() {
  const [theme, setTheme] = useState('light');
  const [dumps, setDumps] = useState([]);
  const [activeDumpId, setActiveDumpId] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navTarget, setNavTarget] = useState(null); // { view, entityId }

  const navigateTo = useCallback((view, entityId) => {
    setActiveView(view);
    setNavTarget(entityId ? { view, entityId } : null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setNavTarget(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // URL hash routing
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && VIEWS.some(v => v.id === hash)) setActiveView(hash);
  }, []);
  useEffect(() => { window.location.hash = activeView; }, [activeView]);

  // Font loading
  useEffect(() => {
    if (!document.getElementById('dsv-fonts')) {
      const link = document.createElement('link');
      link.id = 'dsv-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const activeDump = useMemo(() => dumps.find(d => d.id === activeDumpId)?.data, [dumps, activeDumpId]);

  const addDump = useCallback((dump) => {
    setDumps(prev => [...prev, dump]);
    setActiveDumpId(prev => prev || dump.id);
    setActiveView('dashboard');
  }, []);

  const removeDump = useCallback((id) => {
    setDumps(prev => prev.filter(d => d.id !== id));
    setActiveDumpId(prev => prev === id ? (dumps.find(d => d.id !== id)?.id || null) : prev);
  }, [dumps]);

  const colors = themes[theme];

  const viewTabs = useMemo(() => {
    const tabs = VIEWS.map(v => {
      if (v.id === 'findings' && activeDump) {
        return { ...v, count: activeDump.security_analysis?.total_issues };
      }
      if (v.id === 'members' && activeDump) {
        return { ...v, count: activeDump.members?.length };
      }
      if (v.id === 'diff') {
        return { ...v, count: dumps.length >= 2 ? dumps.length : undefined };
      }
      return v;
    });
    return tabs;
  }, [activeDump, dumps.length]);

  const renderView = () => {
    if (!activeDump) {
      return <EmptyState icon={Upload} title="No dump loaded" desc="Drop a server dump JSON into the sidebar to get started. See sample_dump.template.json for the expected schema." />;
    }

    switch (activeView) {
      case 'dashboard':
        return activeDump ? (
          <>
            <DashboardView dump={activeDump} />
            <PermissionMatrix dump={activeDump} />
            <HiddenChannelsInfo dump={activeDump} />
          </>
        ) : null;
      case 'escalation':
        return activeDump ? <EscalationView dump={activeDump} /> : null;
      case 'hierarchy':
        return activeDump ? <RoleHierarchyView dump={activeDump} /> : null;
      case 'overwrites':
        return activeDump ? <OverwriteMapView dump={activeDump} /> : null;
      case 'findings':
        return activeDump ? <FindingsView dump={activeDump} /> : null;
      case 'members':
        return activeDump ? <MembersView dump={activeDump} /> : null;
      case 'network':
        return activeDump ? <PermissionNetworkView dump={activeDump} /> : null;
      case 'threatmap':
        return activeDump ? <ThreatMapView dump={activeDump} /> : null;
      case 'simulate':
        return activeDump ? <SimulateView dump={activeDump} /> : null;
      case 'threats':
        return activeDump ? <ThreatScorecardView dump={activeDump} /> : null;
      case 'diff':
        return <DiffView dumps={dumps} />;
      case 'report':
        return activeDump ? <ReportView dump={activeDump} /> : null;
      default:
        return null;
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      <div style={{
        minHeight: '100vh', backgroundColor: colors.bg, color: colors.text,
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
        transition: 'background-color 0.2s, color 0.2s',
      }}>
        {/* Global styles */}
        <style>{`
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${colors.scrollbar}; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: ${colors.scrollbarHover}; }
          ::selection { background: ${colors.accent}30; }
          input:focus, select:focus { outline: 2px solid ${colors.accent}; outline-offset: -1px; }
          button:focus-visible { outline: 2px solid ${colors.accent}; outline-offset: 2px; }
        `}</style>

        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px',
          borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.card,
        }}>
          <Shield size={22} style={{ color: colors.accent }} />
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: colors.text, fontFamily: "'Space Grotesk', sans-serif" }}>
            Discord Security Visualizer
          </h1>
          <div style={{ flex: 1 }} />

          {activeDump && (
            <span style={{ fontSize: 12, color: colors.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
              {activeDump.guild?.name}
            </span>
          )}

          <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            borderRadius: 6, border: `1px solid ${colors.border}`,
            backgroundColor: colors.bgAlt, color: colors.text, cursor: 'pointer',
            fontSize: 12, fontFamily: "'Space Grotesk', sans-serif",
          }}>
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
        </header>

        <div style={{ display: 'flex', minHeight: 'calc(100vh - 53px)' }}>
          {/* Sidebar */}
          <aside style={{
            width: sidebarCollapsed ? 48 : 260, flexShrink: 0,
            borderRight: `1px solid ${colors.border}`, backgroundColor: colors.card,
            display: 'flex', flexDirection: 'column', transition: 'width 0.2s',
            overflow: 'hidden',
          }}>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{
              display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-end',
              padding: '8px 12px', border: 'none', background: 'none',
              cursor: 'pointer', color: colors.textMuted,
            }}>
              {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {!sidebarCollapsed && (
              <>
                <div style={{ padding: '0 12px 12px' }}>
                  <DumpUploader
                    dumps={dumps} onAddDump={addDump} onRemoveDump={removeDump}
                    activeDumpId={activeDumpId} onSetActive={setActiveDumpId}
                  />
                </div>

                <div style={{ borderTop: `1px solid ${colors.border}`, padding: '8px 0', flex: 1 }}>
                  {viewTabs.map(tab => {
                    const isActive = activeView === tab.id;
                    const Icon = tab.icon;
                    const isDisabled = !activeDump && tab.id !== 'diff';
                    return (
                      <button key={tab.id}
                        onClick={() => !isDisabled && setActiveView(tab.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '8px 16px', border: 'none', cursor: isDisabled ? 'default' : 'pointer',
                          backgroundColor: isActive ? colors.accentBg : 'transparent',
                          color: isDisabled ? colors.textMuted : isActive ? colors.accent : colors.textSecondary,
                          fontSize: 13, fontWeight: isActive ? 600 : 400,
                          fontFamily: "'Space Grotesk', sans-serif",
                          opacity: isDisabled ? 0.4 : 1,
                          transition: 'all 0.1s',
                          borderLeft: `3px solid ${isActive ? colors.accent : 'transparent'}`,
                        }}>
                        <Icon size={15} />
                        <span style={{ flex: 1, textAlign: 'left' }}>{tab.label}</span>
                        {tab.count != null && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                            backgroundColor: isActive ? `${colors.accent}20` : colors.bgAlt,
                            color: isActive ? colors.accent : colors.textMuted,
                          }}>{tab.count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {sidebarCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 0' }}>
                {viewTabs.map(tab => {
                  const isActive = activeView === tab.id;
                  const Icon = tab.icon;
                  const isDisabled = !activeDump && tab.id !== 'diff';
                  return (
                    <button key={tab.id} title={tab.label}
                      onClick={() => !isDisabled && setActiveView(tab.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: 6, border: 'none',
                        cursor: isDisabled ? 'default' : 'pointer',
                        backgroundColor: isActive ? colors.accentBg : 'transparent',
                        color: isDisabled ? colors.textMuted : isActive ? colors.accent : colors.textSecondary,
                        opacity: isDisabled ? 0.4 : 1,
                      }}>
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          {/* Main content */}
          <main style={{ flex: 1, padding: 24, overflow: 'auto', maxHeight: 'calc(100vh - 53px)' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              {renderView()}
            </div>
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}