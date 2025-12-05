import Modal from "react-modal";

Modal.setAppElement("#root");

export default function CustomModal({
  isOpen,
  onRequestClose,
  title,
  children,
  footer,
  className = "",
}) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      overlayClassName="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-[50]"
      className={`flex flex-col gap-6 bg-surface-200 max-w-[400px] w-[80%] 
                  text-lg text-base-light px-6 py-5 rounded-md ${className}`}
      contentLabel={title}
    >
      {/* Title */}
      {title && <p className="font-semibold text-2xl mb-2">{title}</p>}

      {/* Body content */}
      <div>{children}</div>

      {/* Footer buttons */}
      {footer && <div className="flex gap-6 justify-end">{footer}</div>}
    </Modal>
  );
}
