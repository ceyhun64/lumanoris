'use client';
import { useEffect, useRef, useState } from 'react';
import Masonry from 'react-masonry-css';
import avatar from "../../../images/avatar-bot.jpg";
import CategoryFilter from '@/app/components/CategoryFilter/CategoryFilter';
import { useRouter } from 'next/navigation';
import DialogueModal from '@/app/components/DialogueModal';
import ShareModal from '@/app/components/ShareModal/ShareModal';
import ReportModal from '@/app/components/ReportModal/ReportModal';
import AddToListModal from '@/app/components/AddToListModal/AddToListModal';
import NotesEmpty from '@/app/components/NotesEmpty/NotesEmpty';
import DeleteConfirmModal from '@/app/components/DeleteConfirmModal';

const cards = [
    {
        id: 1,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 2,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        id: 3,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 4,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        id: 5,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 6,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        id: 7,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 8,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        id: 9,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 10,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        id: 11,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 12,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        id: 13,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 14,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        id: 15,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 16,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
];

const myCards = [
    {
        id: 1,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 2,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        id: 3,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 4,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        id: 5,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 6,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        id: 7,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 8,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        id: 9,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 10,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        id: 11,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 12,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        id: 13,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 14,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
    {
        id: 15,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.',
        tag: 'Kurumsal'
    },
    {
        id: 16,
        title: 'Travel Planner AI',
        description: 'Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy Lorem Ipsum is simply dummy The standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dThe standard chunk of Lorem Ipsum used since the 1500s is reproduced LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply below for those interesteLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.dLoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply LoreLorem Ipsum is simply dummy text.Lorem Ipsum is simply dummy text.m Ipsum has been the industry’s standard dummy text ever since the 1500s.',
        tag: 'Eğitim'
    },
];

/* const myCards =[]
const cards =[]; */

export default function DialoguePage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filtered, setFiltered] = useState('Tümü');
    const [allCards, setAllCards] = useState(cards); // cards'ı state'e aldım
    const [myCardsState, setMyCardsState] = useState(myCards); // myCards'ı da state'e aldım
    const [tab, setTab] = useState("all");
    const [showSortMenu, setShowSortMenu] = useState(false); // <-- EKLENDİ!

    const filteredCards = (() => {
        if (tab === "all") {
            return filtered === 'Tümü'
                ? allCards
                : allCards.filter(card => card.tag === filtered);
        }
        if (tab === "mine") {
            return filtered === 'Tümü'
                ? myCardsState
                : myCardsState.filter(card => card.tag === filtered);
        }
        return [];
    })();

    const breakpoints = { default: 5, 1200: 4, 900: 3, 600: 2, 350: 1 };
    const [menuOpenIndex, setMenuOpenIndex] = useState(null);
    const menuRefs = useRef([]);

    const [shareOpen, setShareOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [showFeedbackBadge, setShowFeedbackBadge] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteTargetIndex, setDeleteTargetIndex] = useState(null);

    const handleCloseModal = () => setIsModalOpen(false);

    const toggleMenu = (index) => setMenuOpenIndex(prev => (prev === index ? null : index));

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                menuOpenIndex !== null &&
                menuRefs.current[menuOpenIndex] &&
                !menuRefs.current[menuOpenIndex].contains(event.target)
            ) {
                setMenuOpenIndex(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpenIndex]);

    const handleHideBot = (e, index) => {
        e.stopPropagation();
        const cardToRemove = filteredCards[index];

        // Hangi sekmede olduğuna göre silme işlemi
        if (tab === "all") {
            setAllCards(prev => prev.filter(c => c.id !== cardToRemove.id));
        } else if (tab === "mine") {
            setMyCardsState(prev => prev.filter(c => c.id !== cardToRemove.id));
        }

        setShowFeedbackBadge(true);
        setMenuOpenIndex(null);
        setTimeout(() => setShowFeedbackBadge(false), 2000);
    };

    const handleDelete = (indexToRemove) => {
        const cardToRemove = filteredCards[indexToRemove];

        // Hangi sekmede olduğuna göre silme işlemi
        if (tab === "all") {
            setAllCards(prev => prev.filter(c => c.id !== cardToRemove.id));
        } else if (tab === "mine") {
            setMyCardsState(prev => prev.filter(c => c.id !== cardToRemove.id));
        }

        setDeleteModalVisible(false);
        setDeleteTargetIndex(null);
        setMenuOpenIndex(null);
    };

    const sortOptions = [
        { label: "Paylaşılanlar", value: "all" },
        { label: "Paylaştıklarım", value: "mine" },
    ];




    return (
        <div className="dialogue-wrapper">
            <div className="dialogue-header">
                <h2>Diyalog Defteri</h2>

                <div className="market-filter-select">
                    <button
                        className="market-filter-btn"
                        onClick={() => setShowSortMenu((v) => !v)} // BURASI!
                    >

                        <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.03 0L16 1.07812L8 10L0 1.07812L0.965 0L8 7.83854L15.03 0Z" fill="#FF66C4" />
                        </svg>
                        <span>{sortOptions.find(o => o.value === tab)?.label || "Filtrele"}</span>
                    </button>
                    {showSortMenu && (
                        <div className="market-filter-dropdown">
                            {sortOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    className={`filter-option${tab === opt.value ? " active" : ""}`}
                                    onClick={() => {
                                        setTab(opt.value);
                                        setShowSortMenu(false);
                                    }}
                                >
                                    <span>{opt.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {filteredCards.length > 0 &&
                <CategoryFilter
                    onSelect={(cat) => setFiltered(cat)}
                    selected={filtered}
                />
            }

            {filteredCards.length == 0 &&
                <NotesEmpty />}

            {filteredCards.length > 0 && (
                <Masonry
                    breakpointCols={breakpoints}
                    className="my-masonry-grid"
                    columnClassName="my-masonry-grid_column"
                >
                    {filteredCards.map((card, index) => (
                        <div
                            className="dialogue-card"
                            key={card.id}

                            onClick={(e) => { setIsModalOpen(true) }}
                            style={{ cursor: 'pointer' }}
                        >

                            {/* <div className="shadow">
                        <svg xmlns="http://www.w3.org/2000/svg" width="198" height="143" viewBox="0 0 198 143" fill="none">
                            <g filter="url(#filter0_f_7772_8789)">
                                <ellipse cx="99.0993" cy="-4.46558" rx="61.8786" ry="36.4758" fill="url(#paint0_linear_7772_8789)" />
                            </g>
                            <defs>
                                <filter id="filter0_f_7772_8789" x="-73.2281" y="-151.39" width="344.654" height="293.849" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                    <feGaussianBlur stdDeviation="55.2244" result="effect1_foregroundBlur_7772_8789" />
                                </filter>
                                <linearGradient id="paint0_linear_7772_8789" x1="37.2207" y1="-4.46558" x2="160.978" y2="-4.46558" gradientUnits="userSpaceOnUse">
                                    <stop offset="0.211538" stop-color="#4699FF" />
                                    <stop offset="0.793269" stop-color="#FF66C4" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div> */}
                            <div className="card-content">
                                <p>{card.description}</p>
                            </div>
                            <div className="card-footer">
                                <div className="left">
                                    <div className="icon">
                                        <img src={avatar.src} alt="" />
                                    </div>
                                    <div className='left-item'>
                                        <span className="card-title">{card.id}{card.title}</span>
                                        <span className="card-sub">WanderBot</span>
                                    </div>
                                </div>
                                <div className="menu-wrapper" ref={(el) => (menuRefs.current[index] = el)}>
                                    <div className="menu-icon" onClick={(e) => { e.stopPropagation(); toggleMenu(index); }}>
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9.02286 12.367C9.39152 12.367 9.74508 12.5135 10.0058 12.7742C10.2664 13.0348 10.4129 13.3884 10.4129 13.7571C10.4129 14.1257 10.2664 14.4793 10.0058 14.74C9.74508 15.0007 9.39152 15.1471 9.02286 15.1471C8.65419 15.1471 8.30063 15.0007 8.03995 14.74C7.77926 14.4793 7.63281 14.1257 7.63281 13.7571C7.63281 13.3884 7.77926 13.0348 8.03995 12.7742C8.30063 12.5135 8.65419 12.367 9.02286 12.367ZM9.02286 7.50187C9.39152 7.50187 9.74508 7.64832 10.0058 7.909C10.2664 8.16969 10.4129 8.52325 10.4129 8.89191C10.4129 9.26057 10.2664 9.61413 10.0058 9.87482C9.74508 10.1355 9.39152 10.282 9.02286 10.282C8.65419 10.282 8.30063 10.1355 8.03995 9.87482C7.77926 9.61413 7.63281 9.26057 7.63281 8.89191C7.63281 8.52325 7.77926 8.16969 8.03995 7.909C8.30063 7.64832 8.65419 7.50187 9.02286 7.50187ZM9.02286 2.63672C9.39152 2.63672 9.74508 2.78317 10.0058 3.04385C10.2664 3.30454 10.4129 3.6581 10.4129 4.02676C10.4129 4.39542 10.2664 4.74899 10.0058 5.00967C9.74508 5.27035 9.39152 5.4168 9.02286 5.4168C8.65419 5.4168 8.30063 5.27035 8.03995 5.00967C7.77926 4.74899 7.63281 4.39542 7.63281 4.02676C7.63281 3.6581 7.77926 3.30454 8.03995 3.04385C8.30063 2.78317 8.65419 2.63672 9.02286 2.63672Z" fill="#8C8C8C" />
                                        </svg>
                                    </div>
                                    {menuOpenIndex === index && (
                                        <div className="popup-menu">
                                            <ul>
                                                {/* <li onClick={(e) => { e.stopPropagation(); setModalVisible(true) }}><span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M16 3.5H8C7.46957 3.5 6.96086 3.71071 6.58579 4.08579C6.21071 4.46086 6 4.96957 6 5.5V21.5L12 18.5L18 21.5V5.5C18 4.96957 17.7893 4.46086 17.4142 4.08579C17.0391 3.71071 16.5304 3.5 16 3.5Z" stroke="#FF99D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>

                                        </span> Listeye Kaydet</li> */}
                                                {tab === "mine" ? (<>
                                                    
                                                    <li onClick={(e) => { e.stopPropagation(); setShareOpen(true) }}><span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path opacity="0.3" d="M18 6.5C18.5523 6.5 19 6.05228 19 5.5C19 4.94772 18.5523 4.5 18 4.5C17.4477 4.5 17 4.94772 17 5.5C17 6.05228 17.4477 6.5 18 6.5Z" fill="#FF99D6" />
                                                        <path opacity="0.3" d="M6 13.5C6.55228 13.5 7 13.0523 7 12.5C7 11.9477 6.55228 11.5 6 11.5C5.44772 11.5 5 11.9477 5 12.5C5 13.0523 5.44772 13.5 6 13.5Z" fill="#FF99D6" />
                                                        <path opacity="0.3" d="M18 20.5195C18.5523 20.5195 19 20.0718 19 19.5195C19 18.9672 18.5523 18.5195 18 18.5195C17.4477 18.5195 17 18.9672 17 19.5195C17 20.0718 17.4477 20.5195 18 20.5195Z" fill="#FF99D6" />
                                                        <path d="M18 16.58C17.24 16.58 16.56 16.88 16.04 17.35L8.91 13.2C8.96 12.97 9 12.74 9 12.5C9 12.26 8.96 12.03 8.91 11.8L15.96 7.69C16.5 8.19 17.21 8.5 18 8.5C19.66 8.5 21 7.16 21 5.5C21 3.84 19.66 2.5 18 2.5C16.34 2.5 15 3.84 15 5.5C15 5.74 15.04 5.97 15.09 6.2L8.04 10.31C7.5 9.81 6.79 9.5 6 9.5C4.34 9.5 3 10.84 3 12.5C3 14.16 4.34 15.5 6 15.5C6.79 15.5 7.5 15.19 8.04 14.69L15.16 18.85C15.11 19.06 15.08 19.28 15.08 19.5C15.08 21.11 16.39 22.42 18 22.42C19.61 22.42 20.92 21.11 20.92 19.5C20.92 17.89 19.61 16.58 18 16.58ZM18 4.5C18.55 4.5 19 4.95 19 5.5C19 6.05 18.55 6.5 18 6.5C17.45 6.5 17 6.05 17 5.5C17 4.95 17.45 4.5 18 4.5ZM6 13.5C5.45 13.5 5 13.05 5 12.5C5 11.95 5.45 11.5 6 11.5C6.55 11.5 7 11.95 7 12.5C7 13.05 6.55 13.5 6 13.5ZM18 20.52C17.45 20.52 17 20.07 17 19.52C17 18.97 17.45 18.52 18 18.52C18.55 18.52 19 18.97 19 19.52C19 20.07 18.55 20.52 18 20.52Z" fill="#FF99D6" />
                                                    </svg>
                                                    </span> Paylaş</li>
                                                    <hr />
                                                    <li onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteTargetIndex(index);
                                                        setDeleteModalVisible(true);
                                                    }}>
                                                        <span>
                                                            <svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M5 9.875C5 9.58 5 9.4325 5.09125 9.34125C5.1825 9.25 5.33 9.25 5.625 9.25H24.375C24.67 9.25 24.8175 9.25 24.9088 9.34125C25 9.4325 25 9.58 25 9.875V10.19C25 10.3025 25 10.36 24.9825 10.41C24.9674 10.4531 24.9431 10.4923 24.9113 10.525C24.8738 10.5625 24.8237 10.5875 24.7225 10.6388C23.9088 11.045 23.5025 11.2488 23.2063 11.5538C22.9532 11.8144 22.7599 12.1271 22.64 12.47C22.5 12.87 22.5 13.325 22.5 14.235V20.5C22.5 22.8575 22.5 24.035 21.7675 24.7675C21.035 25.5 19.8575 25.5 17.5 25.5H12.5C10.1425 25.5 8.965 25.5 8.2325 24.7675C7.5 24.035 7.5 22.8575 7.5 20.5V14.235C7.5 13.325 7.5 12.87 7.36 12.47C7.24007 12.1271 7.04683 11.8144 6.79375 11.5538C6.4975 11.2488 6.09125 11.045 5.2775 10.6388C5.20933 10.6103 5.14572 10.572 5.08875 10.525C5.05689 10.4923 5.03257 10.4531 5.0175 10.41C5 10.36 5 10.3025 5 10.19V9.875Z" fill="#FFE4E4" />
                                                                <path d="M12.585 5.9627C12.7275 5.8302 13.0412 5.7127 13.4787 5.62895C13.9808 5.5398 14.49 5.49671 15 5.5002C15.55 5.5002 16.085 5.5452 16.5212 5.62895C16.9575 5.7127 17.2712 5.8302 17.415 5.96395" stroke="#DB1F35" strokeLinecap="round" />
                                                                <path d="M18.75 14.875C18.75 14.5298 18.4702 14.25 18.125 14.25C17.7798 14.25 17.5 14.5298 17.5 14.875V21.125C17.5 21.4702 17.7798 21.75 18.125 21.75C18.4702 21.75 18.75 21.4702 18.75 21.125V14.875Z" fill="#DB1F35" />
                                                                <path d="M12.5 14.875C12.5 14.5298 12.2202 14.25 11.875 14.25C11.5298 14.25 11.25 14.5298 11.25 14.875V21.125C11.25 21.4702 11.5298 21.75 11.875 21.75C12.2202 21.75 12.5 21.4702 12.5 21.125V14.875Z" fill="#DB1F35" />
                                                            </svg>
                                                        </span>
                                                        Sil
                                                    </li>
                                                </>) : (

                                                    <>
                                                    <li onClick={(e) => { e.stopPropagation(); setShareOpen(true) }}><span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path opacity="0.3" d="M18 6.5C18.5523 6.5 19 6.05228 19 5.5C19 4.94772 18.5523 4.5 18 4.5C17.4477 4.5 17 4.94772 17 5.5C17 6.05228 17.4477 6.5 18 6.5Z" fill="#FF99D6" />
                                                            <path opacity="0.3" d="M6 13.5C6.55228 13.5 7 13.0523 7 12.5C7 11.9477 6.55228 11.5 6 11.5C5.44772 11.5 5 11.9477 5 12.5C5 13.0523 5.44772 13.5 6 13.5Z" fill="#FF99D6" />
                                                            <path opacity="0.3" d="M18 20.5195C18.5523 20.5195 19 20.0718 19 19.5195C19 18.9672 18.5523 18.5195 18 18.5195C17.4477 18.5195 17 18.9672 17 19.5195C17 20.0718 17.4477 20.5195 18 20.5195Z" fill="#FF99D6" />
                                                            <path d="M18 16.58C17.24 16.58 16.56 16.88 16.04 17.35L8.91 13.2C8.96 12.97 9 12.74 9 12.5C9 12.26 8.96 12.03 8.91 11.8L15.96 7.69C16.5 8.19 17.21 8.5 18 8.5C19.66 8.5 21 7.16 21 5.5C21 3.84 19.66 2.5 18 2.5C16.34 2.5 15 3.84 15 5.5C15 5.74 15.04 5.97 15.09 6.2L8.04 10.31C7.5 9.81 6.79 9.5 6 9.5C4.34 9.5 3 10.84 3 12.5C3 14.16 4.34 15.5 6 15.5C6.79 15.5 7.5 15.19 8.04 14.69L15.16 18.85C15.11 19.06 15.08 19.28 15.08 19.5C15.08 21.11 16.39 22.42 18 22.42C19.61 22.42 20.92 21.11 20.92 19.5C20.92 17.89 19.61 16.58 18 16.58ZM18 4.5C18.55 4.5 19 4.95 19 5.5C19 6.05 18.55 6.5 18 6.5C17.45 6.5 17 6.05 17 5.5C17 4.95 17.45 4.5 18 4.5ZM6 13.5C5.45 13.5 5 13.05 5 12.5C5 11.95 5.45 11.5 6 11.5C6.55 11.5 7 11.95 7 12.5C7 13.05 6.55 13.5 6 13.5ZM18 20.52C17.45 20.52 17 20.07 17 19.52C17 18.97 17.45 18.52 18 18.52C18.55 18.52 19 18.97 19 19.52C19 20.07 18.55 20.52 18 20.52Z" fill="#FF99D6" />
                                                        </svg>
                                                        </span> Paylaş</li>
                                                        <hr />
                                                        <li onClick={(e) => handleHideBot(e, index)}><span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M20.27 8.985L20.975 13.065C21.0164 13.3041 21.005 13.5494 20.9417 13.7837C20.8783 14.018 20.7646 14.2356 20.6084 14.4213C20.4522 14.6071 20.2573 14.7564 20.0373 14.859C19.8174 14.9615 19.5777 15.0148 19.335 15.015H14.153C14.0322 15.0151 13.9128 15.0415 13.8032 15.0924C13.6936 15.1432 13.5964 15.2173 13.5183 15.3095C13.4401 15.4017 13.383 15.5098 13.3509 15.6263C13.3187 15.7427 13.3123 15.8648 13.332 15.984L13.995 20.029C14.1022 20.6861 14.0716 21.3584 13.905 22.003C13.765 22.536 13.354 22.965 12.812 23.139L12.667 23.186C12.3394 23.2906 11.9842 23.2663 11.674 23.118C11.5078 23.0395 11.3609 22.9256 11.2434 22.7843C11.126 22.643 11.0408 22.4777 10.994 22.3L10.518 20.466C10.3667 19.8823 10.1465 19.3187 9.86198 18.787C9.44598 18.01 8.80398 17.387 8.13698 16.812L6.69698 15.572C6.49735 15.3995 6.34143 15.1821 6.24201 14.9377C6.14258 14.6934 6.10248 14.4289 6.12498 14.166L6.93798 4.773C6.97375 4.35776 7.16387 3.97101 7.4708 3.68907C7.77774 3.40712 8.1792 3.25046 8.59598 3.25H13.245C16.726 3.25 19.697 5.676 20.269 8.985" fill="#FF99D6" />
                                                            <path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M2.96808 15.7652C3.16134 15.7737 3.35039 15.7071 3.49574 15.5795C3.64109 15.4518 3.7315 15.273 3.74808 15.0802L4.71808 3.84422C4.73451 3.6769 4.71666 3.50799 4.66562 3.3478C4.61458 3.18761 4.53142 3.0395 4.42122 2.91253C4.31102 2.78555 4.17609 2.68237 4.02468 2.6093C3.87327 2.53622 3.70855 2.49477 3.54058 2.48749C3.37261 2.48021 3.20492 2.50724 3.04775 2.56694C2.89058 2.62664 2.74723 2.71775 2.62646 2.83471C2.50568 2.95167 2.41002 3.09203 2.3453 3.2472C2.28059 3.40237 2.24819 3.56911 2.25008 3.73722V15.0162C2.2499 15.2097 2.32451 15.3958 2.45832 15.5356C2.59212 15.6753 2.77476 15.757 2.96808 15.7652Z" fill="#FF99D6" />
                                                        </svg>
                                                        </span> İlgilenmiyorum</li>
                                                        
                                                        <li onClick={(e) => handleHideBot(e, index)}>
                                                            <span>
                                                                <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path opacity="0.2" d="M20.25 5.75V19.25C20.25 19.6478 20.092 20.0294 19.8107 20.3107C19.5294 20.592 19.1478 20.75 18.75 20.75H5.25C4.85218 20.75 4.47064 20.592 4.18934 20.3107C3.90804 20.0294 3.75 19.6478 3.75 19.25V5.75C3.75 5.35218 3.90804 4.97064 4.18934 4.68934C4.47064 4.40804 4.85218 4.25 5.25 4.25H18.75C19.1478 4.25 19.5294 4.40804 19.8107 4.68934C20.092 4.97064 20.25 5.35218 20.25 5.75Z" fill="#FF99D6" />
                                                                    <path d="M21 12.5C21 12.6989 20.921 12.8897 20.7803 13.0303C20.6397 13.171 20.4489 13.25 20.25 13.25H3.75C3.55109 13.25 3.36032 13.171 3.21967 13.0303C3.07902 12.8897 3 12.6989 3 12.5C3 12.3011 3.07902 12.1103 3.21967 11.9697C3.36032 11.829 3.55109 11.75 3.75 11.75H20.25C20.4489 11.75 20.6397 11.829 20.7803 11.9697C20.921 12.1103 21 12.3011 21 12.5Z" fill="#FF99D6" />
                                                                </svg>
                                                            </span>
                                                            Bu Profili Önermeyin
                                                        </li>
                                                        <li onClick={(e) => { e.stopPropagation(); setReportOpen(true); console.log(2) }} ><span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path opacity="0.3" d="M9.1 5.5L5 9.6V15.4L9.1 19.5H14.9L19 15.4V9.6L14.9 5.5H9.1ZM12 17.5C11.45 17.5 11 17.05 11 16.5C11 15.95 11.45 15.5 12 15.5C12.55 15.5 13 15.95 13 16.5C13 17.05 12.55 17.5 12 17.5ZM13 14.5H11V7.5H13V14.5Z" fill="#FF99D6" />
                                                            <path d="M15.73 3.5H8.27L3 8.77V16.23L8.27 21.5H15.73L21 16.23V8.77L15.73 3.5ZM19 15.4L14.9 19.5H9.1L5 15.4V9.6L9.1 5.5H14.9L19 9.6V15.4Z" fill="#FF99D6" />
                                                            <path d="M12 17.5C12.5523 17.5 13 17.0523 13 16.5C13 15.9477 12.5523 15.5 12 15.5C11.4477 15.5 11 15.9477 11 16.5C11 17.0523 11.4477 17.5 12 17.5Z" fill="#FF99D6" />
                                                            <path d="M11 7.5H13V14.5H11V7.5Z" fill="#FF99D6" />
                                                        </svg>
                                                        </span> Bildir</li>
                                                    </>
                                                )}






                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </Masonry>
            )}

            <DialogueModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />

            <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />
            <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
            <AddToListModal
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                lists={[]}
            />

            <DeleteConfirmModal
                isOpen={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={() => {
                    handleDelete(deleteTargetIndex);
                    setDeleteModalVisible(false);
                    setDeleteTargetIndex(null);
                }}
            />

            {showFeedbackBadge && (
                <div className="profile-feedback-badge">
                    Uyarınız alındı
                </div>
            )}

        </div>
    );
}
