<?php

namespace App\Entity;

use App\Repository\CharacterLinkRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: CharacterLinkRepository::class)]
#[ORM\Table(name: 'character_link')]
#[ORM\UniqueConstraint(name: 'unique_link', columns: ['person_a_id', 'person_b_id'])]
class CharacterLink
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    private Uuid $id;

    #[ORM\ManyToOne(inversedBy: 'linksAsA')]
    #[ORM\JoinColumn(name: 'person_a_id', nullable: false)]
    private Person $personA;

    #[ORM\ManyToOne(inversedBy: 'linksAsB')]
    #[ORM\JoinColumn(name: 'person_b_id', nullable: false)]
    private Person $personB;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $relationship = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    public function __construct()
    {
        $this->id = Uuid::v4();
    }

    public function getId(): Uuid                     { return $this->id; }
    public function getPersonA(): Person              { return $this->personA; }
    public function setPersonA(Person $p): static     { $this->personA = $p; return $this; }
    public function getPersonB(): Person              { return $this->personB; }
    public function setPersonB(Person $p): static     { $this->personB = $p; return $this; }
    public function getRelationship(): ?string        { return $this->relationship; }
    public function setRelationship(?string $r): static { $this->relationship = $r; return $this; }
    public function getUser(): User                   { return $this->user; }
    public function setUser(User $u): static          { $this->user = $u; return $this; }
}
