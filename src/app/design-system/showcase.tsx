"use client";

import { useState, type ReactNode } from "react";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle, ModalTrigger } from "@/components/ui/modal";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { DatePicker } from "@/components/ui/date-picker";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="border-b border-border py-10 first:pt-0 last:border-b-0">
      <h2 className="font-display text-xl font-medium text-fg">{title}</h2>
      {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      <div className="mt-6 flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

const swatches: { name: string; varName: string }[] = [
  { name: "bg", varName: "--color-bg" },
  { name: "bg-subtle", varName: "--color-bg-subtle" },
  { name: "surface", varName: "--color-surface" },
  { name: "fg", varName: "--color-fg" },
  { name: "fg-muted", varName: "--color-fg-muted" },
  { name: "border", varName: "--color-border" },
  { name: "accent", varName: "--color-accent" },
  { name: "success", varName: "--color-success" },
  { name: "warning", varName: "--color-warning" },
  { name: "danger", varName: "--color-danger" },
];

export function DesignSystemShowcase() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-fg-muted">
        Interne — non indexé
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium text-fg">Design System</h1>
      <p className="mt-2 max-w-xl text-fg-muted">
        Référence vivante des composants de base (brief §36). Les composants métier
        (RequestCard, ProposalCard, BookingCard, ChatMessage) sont volontairement absents ici —
        ils arrivent avec leurs modules respectifs (M5, M7, M8, M9), voir ROADMAP.md.
      </p>

      <Section title="Couleurs" description="Tokens définis dans src/app/globals.css.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {swatches.map((s) => (
            <div key={s.name} className="flex flex-col gap-1.5">
              <div
                className="h-12 w-20 rounded-md border border-border"
                style={{ background: `var(${s.varName})` }}
              />
              <span className="text-xs text-fg-muted">{s.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typographie">
        <div className="flex flex-col gap-3">
          <p className="font-display text-3xl text-fg">Fraunces — titres</p>
          <p className="font-sans text-base text-fg">Geist Sans — texte courant et interface</p>
          <p className="font-mono text-sm text-fg-muted">Geist Mono — code, identifiants</p>
        </div>
      </Section>

      <Section title="Button">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </Section>

      <Section title="Badge">
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
      </Section>

      <Section title="Avatar">
        <Avatar>
          <AvatarImage src="/nonexistent.jpg" alt="" />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>CD</AvatarFallback>
        </Avatar>
      </Section>

      <Section title="Formulaires" description="Input, Textarea, Select, DatePicker, Label.">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-input">Email</Label>
            <Input id="ds-input" type="email" placeholder="vous@exemple.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-select">Catégorie</Label>
            <Select>
              <SelectTrigger id="ds-select">
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="voyage">Voyage</SelectItem>
                <SelectItem value="hotel">Hôtel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-date">Date souhaitée</Label>
            <DatePicker id="ds-date" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="ds-textarea">Description</Label>
            <Textarea id="ds-textarea" placeholder="Décrivez votre demande..." />
          </div>
        </div>
      </Section>

      <Section title="FileUpload">
        <FileUpload maxSizeMb={5} onFilesChange={() => {}} className="w-full max-w-sm" />
      </Section>

      <Section title="Card">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Table pour deux</CardTitle>
            <CardDescription>Restaurant gastronomique — vendredi 20h</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="accent">NEW</Badge>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" size="sm">
              Voir
            </Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="a" className="w-full">
          <TabsList>
            <TabsTrigger value="a">En cours</TabsTrigger>
            <TabsTrigger value="b">Terminées</TabsTrigger>
          </TabsList>
          <TabsContent value="a">Contenu de l&apos;onglet « En cours ».</TabsContent>
          <TabsContent value="b">Contenu de l&apos;onglet « Terminées ».</TabsContent>
        </Tabs>
      </Section>

      <Section title="Table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Client A</TableCell>
              <TableCell>Restaurant</TableCell>
              <TableCell>
                <Badge variant="accent">NEW</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Client B</TableCell>
              <TableCell>Voyage</TableCell>
              <TableCell>
                <Badge variant="success">COMPLETED</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Section title="Pagination">
        <Pagination page={page} pageCount={8} onPageChange={setPage} />
      </Section>

      <Section title="Modal">
        <Modal>
          <ModalTrigger asChild>
            <Button variant="secondary">Ouvrir une modale</Button>
          </ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Confirmer l&apos;action</ModalTitle>
              <ModalDescription>Ceci est un exemple de contenu de modale.</ModalDescription>
            </ModalHeader>
            <div className="flex justify-end gap-2">
              <Button variant="primary">Confirmer</Button>
            </div>
          </ModalContent>
        </Modal>
      </Section>

      <Section title="Dropdown">
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="secondary">
              <Bell className="h-4 w-4" />
              Menu
            </Button>
          </DropdownTrigger>
          <DropdownContent>
            <DropdownItem>Profil</DropdownItem>
            <DropdownItem>Paramètres</DropdownItem>
            <DropdownSeparator />
            <DropdownItem>Se déconnecter</DropdownItem>
          </DropdownContent>
        </Dropdown>
      </Section>

      <Section title="Toast">
        <Button
          variant="secondary"
          onClick={() =>
            toast({ title: "Demande envoyée", description: "Votre concierge a été notifié.", variant: "success" })
          }
        >
          Déclencher un toast
        </Button>
      </Section>
    </div>
  );
}
