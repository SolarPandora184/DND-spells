import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Save, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@shared/schema";

export function Notes() {
  const [activeCategory, setActiveCategory] = useState("session");
  const [noteContent, setNoteContent] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // For now, use a default session ID - in a real app this would come from context
  const sessionId = "default-session";

  const { data: notes = [] } = useQuery({
    queryKey: ['/api/notes', sessionId, activeCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('sessionId', sessionId);
      params.set('category', activeCategory);
      
      const response = await fetch(`/api/notes?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      return response.json();
    },
  });

  const { data: recentNotes = [] } = useQuery({
    queryKey: ['/api/notes', sessionId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('sessionId', sessionId);
      
      const response = await fetch(`/api/notes?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch recent notes');
      const allNotes = await response.json();
      return allNotes.slice(0, 5);
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { title: string; content: string; category: string; sessionId: string }) => {
      const response = await apiRequest('POST', '/api/notes', noteData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Note> }) => {
      const response = await apiRequest('PATCH', `/api/notes/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      });
    },
  });

  // Load the latest note content when category changes
  useEffect(() => {
    const latestNote = notes.find((note: Note) => note.category === activeCategory);
    if (latestNote) {
      setNoteContent(latestNote.content);
      setLastSaved(latestNote.updatedAt ? new Date(latestNote.updatedAt) : null);
    } else {
      setNoteContent("");
      setLastSaved(null);
    }
    setHasUnsavedChanges(false);
  }, [notes, activeCategory]);

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (!hasUnsavedChanges || !noteContent.trim()) return;

    const timeout = setTimeout(() => {
      saveNote();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [noteContent, hasUnsavedChanges]);

  const saveNote = () => {
    if (!noteContent.trim()) return;

    const existingNote = notes.find((note: Note) => note.category === activeCategory);
    const title = `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Notes - ${new Date().toLocaleDateString()}`;

    if (existingNote) {
      updateNoteMutation.mutate({
        id: existingNote.id,
        updates: { content: noteContent },
      });
    } else {
      createNoteMutation.mutate({
        title,
        content: noteContent,
        category: activeCategory,
        sessionId,
      });
    }
  };

  const exportNotes = () => {
    const notesToExport = notes.filter((note: Note) => note.category === activeCategory);
    if (notesToExport.length === 0) {
      toast({
        title: "No notes to export",
        description: "There are no notes in this category to export.",
      });
      return;
    }

    const content = notesToExport
      .map((note: Note) => `# ${note.title}\n\n${note.content}\n\n---\n`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeCategory}-notes.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Notes exported",
      description: "Your notes have been downloaded as a markdown file.",
    });
  };

  const categories = [
    { id: "session", label: "Session Notes" },
    { id: "npcs", label: "NPCs" },
    { id: "locations", label: "Locations" },
  ];

  const formatTime = (date: Date | null) => {
    if (!date) return "Never";
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card id="notes" className="w-full">
      <CardHeader>
        <CardTitle className="font-fantasy text-xl font-bold text-primary flex items-center">
          <FileText className="mr-3 h-5 w-5" />
          Campaign Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              data-testid={`button-category-${category.id}`}
            >
              {category.label}
            </Button>
          ))}
        </div>

        <div>
          <Label htmlFor="note-content">
            {categories.find(c => c.id === activeCategory)?.label}
          </Label>
          <Textarea
            id="note-content"
            className="w-full h-32 mt-2 resize-none"
            placeholder="Write your notes here..."
            value={noteContent}
            onChange={(e) => {
              setNoteContent(e.target.value);
              setHasUnsavedChanges(true);
            }}
            data-testid="textarea-note-content"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground" data-testid="text-last-saved">
            {hasUnsavedChanges ? "Unsaved changes" : `Last saved: ${formatTime(lastSaved)}`}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={saveNote}
              disabled={!noteContent.trim() || createNoteMutation.isPending || updateNoteMutation.isPending}
              data-testid="button-save-note"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              onClick={exportNotes}
              data-testid="button-export-notes"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold mb-2">Recent Notes</h4>
          <div className="space-y-2">
            {recentNotes.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No notes yet
              </div>
            ) : (
              recentNotes.map((note: Note) => (
                <div
                  key={note.id}
                  className="p-2 bg-muted rounded hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  onClick={() => setActiveCategory(note.category)}
                  data-testid={`recent-note-${note.id}`}
                >
                  <div className="text-sm font-medium">{note.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(note.updatedAt ? new Date(note.updatedAt) : null)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
