'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SontaHeadCard, SontaHeadForm, DeleteDialog } from '@/components/sonta-heads';
import { sontaHeadsService } from '@/services';
import type { SontaHead, SontaHeadQueryParams, CreateSontaHeadData, UpdateSontaHeadData } from '@/types';
import { SontaHeadStatus } from '@/types';

export default function SontaHeadsPage() {
  const [sontaHeads, setSontaHeads] = useState<SontaHead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSontaHead, setSelectedSontaHead] = useState<SontaHead | null>(null);

  const fetchSontaHeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: SontaHeadQueryParams = {
        page: currentPage,
        limit: 12,
      };
      if (search) params.search = search;
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter as SontaHeadStatus;
      }

      const result = await sontaHeadsService.getAll(params);
      setSontaHeads(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      toast.error('Failed to load Sonta Heads');
      console.error('Error fetching sonta heads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    fetchSontaHeads();
  }, [fetchSontaHeads]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const handleCreate = async (data: Record<string, unknown>, image?: File) => {
    if (!image) {
      toast.error('Profile image is required');
      return;
    }
    try {
      setIsSubmitting(true);
      const createData: CreateSontaHeadData = {
        name: data.name as string,
        phone: data.phone as string,
        email: data.email as string || undefined,
        notes: data.notes as string || undefined,
        status: data.status as SontaHeadStatus || undefined,
        profileImage: image,
      };
      await sontaHeadsService.create(createData);
      toast.success('Sonta Head created successfully');
      setIsFormOpen(false);
      fetchSontaHeads();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create Sonta Head');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: Record<string, unknown>, image?: File) => {
    if (!selectedSontaHead) return;
    try {
      setIsSubmitting(true);
      const updateData: UpdateSontaHeadData = {
        name: data.name as string,
        phone: data.phone as string,
        email: data.email as string,
        notes: data.notes as string,
        status: data.status as SontaHeadStatus,
        profileImage: image,
      };
      await sontaHeadsService.update(selectedSontaHead.id, updateData);
      toast.success('Sonta Head updated successfully');
      setIsFormOpen(false);
      setSelectedSontaHead(null);
      fetchSontaHeads();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update Sonta Head');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSontaHead) return;
    try {
      setIsSubmitting(true);
      await sontaHeadsService.delete(selectedSontaHead.id);
      toast.success('Sonta Head deleted successfully');
      setIsDeleteOpen(false);
      setSelectedSontaHead(null);
      fetchSontaHeads();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete Sonta Head');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditForm = (sontaHead: SontaHead) => {
    setSelectedSontaHead(sontaHead);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (sontaHead: SontaHead) => {
    setSelectedSontaHead(sontaHead);
    setIsDeleteOpen(true);
  };

  const openCreateForm = () => {
    setSelectedSontaHead(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-hero bg-clip-text text-transparent">
            Sonta Heads
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Manage registered members
            {total > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                {total}
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={openCreateForm}
          className="transition-smooth hover-scale bg-gradient-hero"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Sonta Head
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-soft">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-smooth" />
              <Input
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 border-border/50 focus:border-primary transition-smooth"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-11 border-border/50">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={SontaHeadStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={SontaHeadStatus.INACTIVE}>Inactive</SelectItem>
                <SelectItem value={SontaHeadStatus.SUSPENDED}>Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {(search || statusFilter !== 'all') && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
              <p className="text-sm font-semibold text-muted-foreground">Active filters:</p>
              <div className="flex flex-wrap gap-2">
                {search && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    Search: "{search}"
                  </div>
                )}
                {statusFilter !== 'all' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/10 text-secondary">
                    Status: {statusFilter}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading Sonta Heads...</p>
        </div>
      ) : sontaHeads.length === 0 ? (
        <Card className="border-border/50 shadow-soft">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">
                  {search || statusFilter !== 'all'
                    ? 'No Sonta Heads Found'
                    : 'No Sonta Heads Yet'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {search || statusFilter !== 'all'
                    ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
                    : 'Get started by adding your first Sonta Head with facial recognition enrollment.'}
                </p>
              </div>
              {!(search || statusFilter !== 'all') && (
                <Button
                  onClick={openCreateForm}
                  className="mt-4 transition-smooth hover-scale bg-gradient-hero"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Sonta Head
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sontaHeads.map((sontaHead, index) => (
              <div
                key={sontaHead.id}
                className="stagger-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <SontaHeadCard
                  sontaHead={sontaHead}
                  onEdit={openEditForm}
                  onDelete={openDeleteDialog}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="border-border/50 shadow-soft">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-medium">
                    Showing page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="transition-smooth hover-scale"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="transition-smooth hover-scale"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create/Edit Form Dialog */}
      <SontaHeadForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedSontaHead(null);
        }}
        onSubmit={selectedSontaHead ? handleUpdate : handleCreate}
        sontaHead={selectedSontaHead}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedSontaHead(null);
        }}
        onConfirm={handleDelete}
        sontaHead={selectedSontaHead}
        isLoading={isSubmitting}
      />
    </div>
  );
}
