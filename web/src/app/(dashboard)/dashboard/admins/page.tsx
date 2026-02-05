'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  UserCog,
  Loader2,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import {
  adminService,
  type Admin,
  type CreateAdminDto,
  type UpdateAdminDto,
} from '@/services/admin.service';
import { AdminRole } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add/Edit Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState<CreateAdminDto | UpdateAdminDto>({
    email: '',
    fullName: '',
    role: AdminRole.ADMIN,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Dialog State
  const [deletingAdmin, setDeletingAdmin] = useState<Admin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminService.findAll();
      setAdmins(data);
    } catch {
      setError('Failed to load administrators');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const openAddDialog = () => {
    setEditingAdmin(null);
    setFormData({ email: '', fullName: '', role: AdminRole.ADMIN });
    setFormError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      email: admin.email,
      fullName: admin.fullName || '',
      role: admin.role,
      isActive: admin.isActive,
    });
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.email) {
      setFormError('Email is required');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingAdmin) {
        await adminService.update(editingAdmin.id, formData as UpdateAdminDto);
      } else {
        await adminService.create(formData as CreateAdminDto);
      }
      setIsDialogOpen(false);
      loadAdmins();
    } catch (error) {
      if (error instanceof Error && error.message.includes('409')) {
        setFormError('Email already exists');
      } else {
        setFormError('Failed to save administrator');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAdmin) return;

    setIsDeleting(true);
    try {
      await adminService.remove(deletingAdmin.id);
      setDeletingAdmin(null);
      loadAdmins();
    } catch {
      setError('Failed to delete administrator');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: AdminRole) => {
    if (role === AdminRole.SUPER_ADMIN) {
      return (
        <Badge variant="default" className="bg-primary">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Super Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge variant="outline" className="border-success text-success">
          Active
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="border-muted-foreground text-muted-foreground"
      >
        Inactive
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
          <p className="text-muted-foreground">Manage system administrators</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAdmin ? 'Edit Administrator' : 'Add Administrator'}
              </DialogTitle>
              <DialogDescription>
                {editingAdmin
                  ? 'Update administrator details'
                  : 'Add a new administrator. They will receive a magic link to sign in.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {formError && (
                <div className="text-sm text-danger bg-danger/10 p-3 rounded-md">
                  {formError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: AdminRole) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AdminRole.ADMIN}>Admin</SelectItem>
                    <SelectItem value={AdminRole.SUPER_ADMIN}>
                      Super Admin
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <Select
                    value={
                      (formData as UpdateAdminDto).isActive
                        ? 'active'
                        : 'inactive'
                    }
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        isActive: value === 'active',
                      } as UpdateAdminDto)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAdmin ? 'Save Changes' : 'Add Admin'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            All Administrators
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-danger mb-4">{error}</p>
              <Button variant="outline" onClick={loadAdmins}>
                Try Again
              </Button>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No administrators found
              </p>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Admin
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.email}</TableCell>
                    <TableCell>{admin.fullName || '-'}</TableCell>
                    <TableCell>{getRoleBadge(admin.role)}</TableCell>
                    <TableCell>{getStatusBadge(admin.isActive)}</TableCell>
                    <TableCell>
                      {admin.lastLoginAt
                        ? format(
                            new Date(admin.lastLoginAt),
                            'MMM d, yyyy h:mm a'
                          )
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(admin)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-danger hover:text-danger"
                          onClick={() => setDeletingAdmin(admin)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingAdmin}
        onOpenChange={() => setDeletingAdmin(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Administrator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{deletingAdmin?.email}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn('bg-danger hover:bg-danger/90')}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
