import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Crown,
  UserCog,
  Users,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const roles = [
  {
    name: 'Super Admin',
    key: 'super_admin',
    icon: Crown,
    color: 'text-warning',
    bgColor: 'bg-warning/20',
    description: 'Full system access with all privileges',
    permissions: {
      viewServer: true,
      createServer: true,
      editServer: true,
      deleteServer: true,
      deploy: true,
      domainManage: true,
      gitConnect: true,
      securitySettings: true,
      auditLogs: true,
      userManage: true,
    },
  },
  {
    name: 'Admin',
    key: 'admin',
    icon: UserCog,
    color: 'text-cyan',
    bgColor: 'bg-cyan/20',
    description: 'Management access without destructive actions',
    permissions: {
      viewServer: true,
      createServer: true,
      editServer: true,
      deleteServer: false,
      deploy: true,
      domainManage: true,
      gitConnect: true,
      securitySettings: false,
      auditLogs: true,
      userManage: false,
    },
  },
  {
    name: 'Reseller',
    key: 'reseller',
    icon: Users,
    color: 'text-primary',
    bgColor: 'bg-primary/20',
    description: 'Limited view and deploy access only',
    permissions: {
      viewServer: true,
      createServer: false,
      editServer: false,
      deleteServer: false,
      deploy: true,
      domainManage: false,
      gitConnect: false,
      securitySettings: false,
      auditLogs: false,
      userManage: false,
    },
  },
];

const permissionLabels: Record<string, string> = {
  viewServer: 'View Server',
  createServer: 'Create Server',
  editServer: 'Edit Server',
  deleteServer: 'Delete Server',
  deploy: 'Deploy',
  domainManage: 'Domain Management',
  gitConnect: 'Git Connection',
  securitySettings: 'Security Settings',
  auditLogs: 'Audit Logs',
  userManage: 'User Management',
};

export function PermissionMatrix() {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Permission Matrix</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Role-based access control (Read Only)
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-muted/30 gap-1">
            <Lock className="h-3 w-3" />
            Locked
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Permission</th>
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <th key={role.key} className="text-center py-3 px-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', role.bgColor)}>
                          <Icon className={cn('h-4 w-4', role.color)} />
                        </div>
                        <span className="text-xs font-medium text-foreground">{role.name}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Object.keys(permissionLabels).map((permKey) => (
                <tr key={permKey} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-3 px-2 text-sm text-foreground">{permissionLabels[permKey]}</td>
                  {roles.map((role) => {
                    const hasPermission = role.permissions[permKey as keyof typeof role.permissions];
                    return (
                      <td key={`${role.key}-${permKey}`} className="text-center py-3 px-4">
                        {hasPermission ? (
                          <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive/50 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Role Descriptions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div key={role.key} className="p-4 rounded-lg bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('h-6 w-6 rounded-lg flex items-center justify-center', role.bgColor)}>
                    <Icon className={cn('h-3 w-3', role.color)} />
                  </div>
                  <span className="font-medium text-foreground text-sm">{role.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{role.description}</p>
              </div>
            );
          })}
        </div>

        {/* Notice */}
        <div className="mt-4 p-3 rounded-lg bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            <Lock className="h-3 w-3 inline mr-1" />
            Custom roles are not supported. Contact system administrator for role changes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
