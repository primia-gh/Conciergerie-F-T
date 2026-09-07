"use client";

import { useActionState, useState } from "react";
import { deleteMyAccount, type DeleteAccountState } from "@/server/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/modal";

const initialState: DeleteAccountState = { error: null };
const CONFIRM_WORD = "SUPPRIMER";

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteMyAccount, initialState);
  const [confirmText, setConfirmText] = useState("");

  return (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="danger">Supprimer mon compte</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Supprimer définitivement votre compte ?</ModalTitle>
          <ModalDescription>
            Cette action est irréversible. Votre compte sera immédiatement déconnecté et vous ne
            pourrez plus vous reconnecter. Vos informations personnelles (nom, téléphone, email)
            seront effacées ; l&apos;historique de vos demandes est conservé à des fins
            probatoires (voir la politique de confidentialité).
          </ModalDescription>
        </ModalHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm">
              Tapez <span className="font-semibold">{CONFIRM_WORD}</span> pour confirmer
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              autoComplete="off"
            />
          </div>
          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          <Button type="submit" variant="danger" disabled={confirmText !== CONFIRM_WORD || pending}>
            {pending ? "Suppression…" : "Confirmer la suppression"}
          </Button>
        </form>
      </ModalContent>
    </Modal>
  );
}
