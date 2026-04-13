import Button from "./Button";

export default function Modal({ title, children, onClose, footer }) {
  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title" className="modal__title">
          {title}
        </h2>
        {children}
        <div className="modal__actions">
          {footer}
          <Button variant="ghost" type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
